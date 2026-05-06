import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Campeonato, CampoFormulario, ModalidadeConfig } from './entities/campeonato.entity';
import { CreateCampeonatoDto } from './dto/create-campeonato.dto';
import { UpdateCampeonatoDto } from './dto/update-campeonato.dto';

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
        const campeonato = await this.findOne(id);
        this.campeonatoRepo.assign(campeonato, dto);
        await this.em.flush();
        return campeonato;
    }

    async remove(id: string): Promise<void> {
        const campeonato = await this.findOne(id);
        campeonato.isDeleted = true;
        await this.em.flush();
    }

    /** Retorna a configuração do formulário */
    async getConfiguracao(id: string) {
        const camp = await this.findOne(id);
        return {
            modalidades: camp.modalidades || DEFAULT_MODALIDADES,
            tamanhosCamisa: camp.tamanhosCamisa || DEFAULT_CAMISAS,
            camposFormulario: camp.camposFormulario || DEFAULT_CAMPOS,
            precosModalidade: camp.precosModalidade,
            loteNome: camp.loteNome,
            valorInscricao: camp.valorInscricao,
            chavePix: camp.chavePix,
            whatsappNumero: camp.whatsappNumero,
            regulamento: camp.regulamento,
            regulamentoTipo: camp.regulamentoTipo,
            regulamentoPdfUrl: camp.regulamentoPdfUrl,
            termoResponsabilidadePdfUrl: camp.termoResponsabilidadePdfUrl,
            termoUsoImagemPdfUrl: camp.termoUsoImagemPdfUrl,
        };
    }
}

