/** Remove o sufixo de sexo do nome da categoria, ex: "Iniciante Masculino" → "Iniciante". */
export function baseCategoria(categoria: string): string {
    return categoria.replace(/\s+(Masculino|Feminino|Mista|Misto)\s*$/i, '').trim();
}

/** Deriva o sexo embutido no nome da categoria. "Mista"/"Misto" ou sem sufixo reconhecido = 'ambos'. */
export function sexoDaCategoria(categoria: string): 'masculino' | 'feminino' | 'ambos' {
    const trimmed = categoria.trim();
    if (/feminino$/i.test(trimmed)) return 'feminino';
    if (/masculino$/i.test(trimmed)) return 'masculino';
    return 'ambos';
}

/**
 * Verifica se uma prova (com `categorias` base opcionais e `sexo`) é elegível para
 * uma `categoriaKey` no formato "modalidade|categoria" (ex: "Individual|Iniciante Masculino").
 */
export function provaElegivelParaCategoriaKey(
    prova: { categorias?: string[] | null; sexo?: string | null },
    categoriaKey: string,
): boolean {
    const categoria = categoriaKey.includes('|') ? categoriaKey.split('|').slice(1).join('|') : categoriaKey;
    const base = baseCategoria(categoria);
    const sexoCat = sexoDaCategoria(categoria);

    const categoriasOk = !prova.categorias?.length || prova.categorias.includes(base);
    const sexoOk = !prova.sexo || prova.sexo === 'ambos' || sexoCat === 'ambos' || prova.sexo === sexoCat;

    return categoriasOk && sexoOk;
}
