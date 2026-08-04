/** Busca no `dadosFormulario` (JSON livre, chaves = nome do campo configurado) a primeira que combine com o padrão. */
export function resolveCampoFormulario(dadosFormulario: Record<string, any> | undefined | null, pattern: RegExp): string | undefined {
    if (!dadosFormulario) return undefined;
    const key = Object.keys(dadosFormulario).find((k) => pattern.test(k));
    if (key && dadosFormulario[key] != null && dadosFormulario[key] !== '') return String(dadosFormulario[key]);
    return undefined;
}

export function resolveCidade(dadosFormulario: Record<string, any> | undefined | null): string | undefined {
    return resolveCampoFormulario(dadosFormulario, /cidade|city/i);
}

export function resolveBox(dadosFormulario: Record<string, any> | undefined | null): string | undefined {
    return resolveCampoFormulario(dadosFormulario, /box|academia/i);
}
