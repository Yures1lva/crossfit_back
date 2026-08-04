/** Remove acentos, baixa a caixa e normaliza espaços — pra comparar strings digitadas de formas diferentes. */
export function normalizeStr(s: string): string {
    return s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

/** Distância de Levenshtein (nº mínimo de edições pra transformar `a` em `b`). */
function levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const dp = new Array(n + 1);
    for (let j = 0; j <= n; j++) dp[j] = j;

    for (let i = 1; i <= m; i++) {
        let prev = dp[0];
        dp[0] = i;
        for (let j = 1; j <= n; j++) {
            const tmp = dp[j];
            dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
            prev = tmp;
        }
    }
    return dp[n];
}

/** Similaridade entre 0 (nada a ver) e 1 (idênticas), já normalizando acento/caixa/espaço. */
export function similarityRatio(a: string, b: string): number {
    const na = normalizeStr(a);
    const nb = normalizeStr(b);
    if (!na && !nb) return 1;
    if (!na || !nb) return 0;
    const dist = levenshtein(na, nb);
    return 1 - dist / Math.max(na.length, nb.length);
}

/**
 * Considera `a` e `b` a "mesma coisa" digitada de formas diferentes: iguais após
 * normalizar, uma contida na outra (ex: "CrossFit Norte" dentro de "CrossFit Norte - SP"),
 * ou similaridade acima do threshold (cobre typos/espaços a mais).
 */
export function isSimilar(a: string, b: string, threshold = 0.82): boolean {
    const na = normalizeStr(a);
    const nb = normalizeStr(b);
    if (!na || !nb) return false;
    if (na === nb) return true;
    if (na.includes(nb) || nb.includes(na)) return true;
    return similarityRatio(na, nb) >= threshold;
}

/** Agrupa valores parecidos e devolve uma lista deduplicada, mantendo a grafia mais frequente de cada grupo. */
export function dedupeSimilarStrings(values: string[]): string[] {
    const counts = new Map<string, number>();
    for (const v of values) {
        const trimmed = v.trim();
        if (!trimmed) continue;
        counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
    }

    const uniqueSortedByFreq = [...counts.keys()].sort((a, b) => (counts.get(b)! - counts.get(a)!));

    const canonical: string[] = [];
    for (const v of uniqueSortedByFreq) {
        if (!canonical.some((c) => isSimilar(c, v))) canonical.push(v);
    }

    return canonical.sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
