import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Campeonato, CampoFormulario, ModalidadeConfig } from './entities/campeonato.entity';
import { CreateCampeonatoDto } from './dto/create-campeonato.dto';
import { UpdateCampeonatoDto, RenomearCategoriaDto } from './dto/update-campeonato.dto';
import { Inscricao, StatusInscricao } from '../inscricao/entities/inscricao.entity';
import { Prova } from '../prova/entities/prova.entity';
import { Bateria } from '../bateria/entities/bateria.entity';
import { baseCategoria } from '../common/utils/categoria.util';

/** Modalidades padrão pré-configuradas */
const DEFAULT_MODALIDADES: ModalidadeConfig[] = [
    {
        nome: 'Individual',
        qtdAtletas: 1,
        categorias: [
            'Iniciante Masculino', 'Iniciante Feminino',
            'Intermediário Masculino', 'Intermediário Feminino',
            'Master 35+ Masculino', 'Master 40+ Masculino',
            'RX Masculino',
        ],
    },
    {
        nome: 'Dupla',
        qtdAtletas: 2,
        categorias: ['Iniciante Mista', 'Scaled Mista'],
    },
    {
        nome: 'Trio',
        qtdAtletas: 3,
        categorias: [
            'Iniciante Masculino', 'Iniciante Feminino',
            'Scaled Masculino', 'Scaled Feminino',
        ],
    },
];

/** Tamanhos de camisa padrão */
const DEFAULT_CAMISAS = [
    'PP Feminino',
    'P Feminino',
    'M Feminino',
    'G Feminino',
    'GG Feminino',
    'P Masculino',
    'M Masculino',
    'G Masculino',
    'GG Masculino',
];

/** Campos padrão do formulário de inscrição */
const DEFAULT_CAMPOS: CampoFormulario[] = [
    { nome: 'Nome do(s) atleta(s)', tipo: 'text', obrigatorio: true },
    { nome: 'Data de nascimento', tipo: 'date', obrigatorio: true },
    { nome: 'CPF', tipo: 'masked', obrigatorio: true, mascara: '000.000.000-00' },
    { nome: 'Cidade', tipo: 'text', obrigatorio: true },
    { nome: 'Box que representa', tipo: 'text', obrigatorio: false },
    { nome: 'Foto do atleta/dupla', tipo: 'upload_image', obrigatorio: false, descricao: 'Será postada no Instagram' },
    { nome: 'Comprovante de pagamento', tipo: 'upload_document', obrigatorio: false, descricao: 'Imagem ou PDF' },
];

@Injectable()
export class CampeonatoService {
    constructor(
        @InjectRepository(Campeonato)
        private readonly campeonatoRepo: EntityRepository<Campeonato>,
        private readonly em: EntityManager,
    ) { }

    async findAll(): Promise<Campeonato[]> {
        return this.campeonatoRepo.findAll({
            where: { isDeleted: false },
            orderBy: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Campeonato> {
        const campeonato = await this.campeonatoRepo.findOne({ id, isDeleted: false });
        if (!campeonato) throw new NotFoundException(`Campeonato ${id} não encontrado`);
        return campeonato;
    }

    async findBySlug(slug: string): Promise<Campeonato> {
        const campeonato = await this.campeonatoRepo.findOne({ slug, isDeleted: false });
        if (!campeonato) throw new NotFoundException(`Campeonato ${slug} não encontrado`);
        return campeonato;
    }

    async create(dto: CreateCampeonatoDto): Promise<Campeonato> {
        const campeonato = new Campeonato();
        Object.assign(campeonato, dto);

        // Aplica defaults se não fornecido
        if (!campeonato.modalidades) campeonato.modalidades = DEFAULT_MODALIDADES;
        if (!campeonato.tamanhosCamisa) campeonato.tamanhosCamisa = DEFAULT_CAMISAS;
        if (!campeonato.camposFormulario) campeonato.camposFormulario = DEFAULT_CAMPOS;

        this.em.persist(campeonato);
        await this.em.flush();
        return campeonato;
    }

    async update(id: string, dto: UpdateCampeonatoDto): Promise<Campeonato> {
        // `renomearCategorias` é instrução, não campo do campeonato — fica fora do assign.
        const { renomearCategorias, ...dadosDoCampeonato } = dto;

        const campeonato = await this.findOne(id);
        this.campeonatoRepo.assign(campeonato, dadosDoCampeonato);
        await this.em.flush();

        if (renomearCategorias?.length) {
            await this.propagarRenomeioDeCategorias(campeonato, renomearCategorias);
        }

        return campeonato;
    }

    /**
     * Categoria é texto livre, copiado para quem se inscreveu, para as provas e para as
     * baterias. Renomear só na configuração do campeonato deixaria tudo isso apontando para
     * um nome que não existe mais — as inscrições sumiriam dos filtros, da tabela geral e do
     * cronograma. Por isso o nome novo é propagado nos três lugares.
     */
    private async propagarRenomeioDeCategorias(
        campeonato: Campeonato,
        renomeios: RenomearCategoriaDto[],
    ): Promise<void> {
        const campeonatoId = campeonato.id;
        const paraCategoria = (categoria?: string, modalidade?: string) =>
            renomeios.find(
                (r) => r.de === categoria && (!r.modalidade || r.modalidade === modalidade),
            )?.para;

        const inscricoes = await this.em.find(Inscricao, {
            campeonato: { id: campeonatoId },
            isDeleted: false,
        });
        for (const inscricao of inscricoes) {
            const nova = paraCategoria(inscricao.categoria, inscricao.modalidade);
            if (nova) inscricao.categoria = nova;
        }

        // Provas guardam a categoria base, sem o sufixo de sexo ("Iniciante Masculino" →
        // "Iniciante"), e essa base é compartilhada entre modalidades. Se alguma categoria que
        // sobrou ainda usa a base antiga — o Trio continua com "Iniciante Masculino" enquanto
        // a Individual virou "Novato Masculino" —, mexer na prova quebraria a outra. Nesse
        // caso a prova fica como está e o organizador ajusta na tela de Provas.
        const basesEmUso = new Set(
            (campeonato.modalidades ?? []).flatMap((m) => (m.categorias ?? []).map(baseCategoria)),
        );
        const basesRenomeadas = renomeios
            .map((r) => ({ de: baseCategoria(r.de), para: baseCategoria(r.para) }))
            .filter((r) => r.de !== r.para && !basesEmUso.has(r.de));

        if (basesRenomeadas.length > 0) {
            const provas = await this.em.find(Prova, {
                campeonato: { id: campeonatoId },
                isDeleted: false,
            });
            for (const prova of provas) {
                if (!prova.categorias?.length) continue;
                prova.categorias = prova.categorias.map(
                    (base) => basesRenomeadas.find((r) => r.de === base)?.para ?? base,
                );
            }
        }

        const baterias = await this.em.find(Bateria, {
            campeonato: { id: campeonatoId },
            isDeleted: false,
        });
        for (const bateria of baterias) {
            const [modalidade, ...resto] = bateria.categoriaKey.split('|');
            const nova = paraCategoria(resto.join('|'), modalidade);
            if (nova) bateria.categoriaKey = [modalidade, nova].join('|');
        }

        await this.em.flush();
    }

    async remove(id: string): Promise<void> {
        const campeonato = await this.findOne(id);
        campeonato.isDeleted = true;
        await this.em.flush();
    }

    /**
     * Quantas inscrições ocupam vaga hoje, no total e por modalidade/categoria. Usa o mesmo
     * critério que barra a inscrição: tudo menos rejeitada/cancelada.
     */
    private async contarInscritos(campeonatoId: string) {
        const inscricoes = await this.em.find(
            Inscricao,
            {
                campeonato: { id: campeonatoId },
                isDeleted: false,
                status: { $nin: [StatusInscricao.REJECTED, StatusInscricao.CANCELLED] },
            },
            { fields: ['modalidade', 'categoria'] },
        );

        const inscritosPorCategoria: Record<string, Record<string, number>> = {};
        for (const { modalidade, categoria } of inscricoes) {
            if (!modalidade || !categoria) continue;
            const porCategoria = (inscritosPorCategoria[modalidade] ??= {});
            porCategoria[categoria] = (porCategoria[categoria] ?? 0) + 1;
        }
        return { totalInscritos: inscricoes.length, inscritosPorCategoria };
    }

    /** Retorna a configuração do formulário */
    async getConfiguracao(id: string) {
        const camp = await this.findOne(id);
        return {
            maxInscritos: camp.maxInscritos,
            ...(await this.contarInscritos(camp.id)),
            modalidades: camp.modalidades || DEFAULT_MODALIDADES,
            tamanhosCamisa: camp.tamanhosCamisa || DEFAULT_CAMISAS,
            camposFormulario: camp.camposFormulario || DEFAULT_CAMPOS,
            precosModalidade: camp.precosModalidade,
            loteNome: camp.loteNome,
            valorInscricao: camp.valorInscricao,
            chavePix: camp.chavePix,
            pixDescricao: camp.pixDescricao,
            whatsappNumero: camp.whatsappNumero,
            regulamento: camp.regulamento,
            regulamentoTipo: camp.regulamentoTipo,
            regulamentoPdfUrl: camp.regulamentoPdfUrl,

            termoUsoImagemPdfUrl: camp.termoUsoImagemPdfUrl,
        };
    }
}

