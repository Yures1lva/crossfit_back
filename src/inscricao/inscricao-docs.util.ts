import type { Inscricao } from './entities/inscricao.entity';

/** Campos de documento obrigatório — existem tanto no titular quanto em cada parceiro. */
export const CAMPOS_DOCUMENTO = ['laudoMedicoUrl', 'documentoIdentidadeUrl', 'termoUrl'] as const;
export type CampoDocumento = (typeof CAMPOS_DOCUMENTO)[number];

export const ROTULO_DOCUMENTO: Record<CampoDocumento, string> = {
    laudoMedicoUrl: 'Laudo médico',
    documentoIdentidadeUrl: 'Documento de identidade',
    termoUrl: 'Termo de uso de imagem',
};

/**
 * Quantos atletas a inscrição cobre (titular + parceiros). Usa o `qtdAtletas` da modalidade
 * quando o campeonato está carregado, pra contar também os parceiros que ainda não foram cadastrados.
 */
export function qtdAtletasDaInscricao(inscricao: Inscricao): number {
    const modalidades = (inscricao.campeonato as { modalidades?: { nome: string; qtdAtletas?: number }[] } | undefined)?.modalidades;
    const daModalidade = modalidades?.find((m) => m.nome === inscricao.modalidade)?.qtdAtletas ?? 1;
    return Math.max(daModalidade, 1 + (inscricao.parceiros?.length ?? 0));
}

/** Documentos da equipe inteira: 3 por atleta (trio = 9). */
export function resumoDocumentos(inscricao: Inscricao): { enviados: number; total: number; pendentes: string[] } {
    const qtdAtletas = qtdAtletasDaInscricao(inscricao);
    const parceiros = inscricao.parceiros ?? [];
    const isEquipe = qtdAtletas > 1;

    const atletas: { nome: string; docs: Partial<Record<CampoDocumento, string>> }[] = [
        { nome: inscricao.nomeAtleta, docs: inscricao },
        ...parceiros.map((p, idx) => ({ nome: p.nome || `Parceiro ${idx + 1}`, docs: p })),
    ];

    let enviados = 0;
    const pendentes: string[] = [];
    for (const atleta of atletas) {
        for (const campo of CAMPOS_DOCUMENTO) {
            if (atleta.docs[campo]) enviados++;
            else pendentes.push(isEquipe ? `${ROTULO_DOCUMENTO[campo]} (${atleta.nome})` : ROTULO_DOCUMENTO[campo]);
        }
    }
    for (let idx = parceiros.length; idx < qtdAtletas - 1; idx++) {
        pendentes.push(`Dados e documentos do parceiro ${idx + 1}`);
    }

    return { enviados, total: qtdAtletas * CAMPOS_DOCUMENTO.length, pendentes };
}
