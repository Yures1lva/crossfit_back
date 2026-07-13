import ExcelJS from 'exceljs';
import { Inscricao } from './entities/inscricao.entity';
import { ResponseInscricaoDto } from './dto/response-inscricao.dto';

const COLORS = {
    bgPrimary: 'FF1A1A1B',
    bgCard: 'FF2C2B2C',
    bgTertiary: 'FF2E2D2E',
    accent: 'FFD9DD6E',
    textOnAccent: 'FF242223',
    textPrimary: 'FFFFFFFF',
    textMuted: 'FFB8B8BC',
    border: 'FF3A393B',
};

const COLUMNS = [
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'Nome', key: 'nome', width: 32 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Categoria', key: 'categoria', width: 20 },
    { header: 'Cidade', key: 'cidade', width: 22 },
    { header: 'Telefone', key: 'telefone', width: 20 },
];

function styleSheet(sheet: ExcelJS.Worksheet, titulo: string) {
    sheet.columns = COLUMNS;

    sheet.mergeCells(1, 1, 1, COLUMNS.length);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = titulo;
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: COLORS.textPrimary } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgPrimary } };
    sheet.getRow(1).height = 28;

    const headerRow = sheet.getRow(2);
    headerRow.values = COLUMNS.map((c) => c.header);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.textOnAccent } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accent } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
            top: { style: 'thin', color: { argb: COLORS.border } },
            bottom: { style: 'thin', color: { argb: COLORS.border } },
        };
    });

    sheet.views = [{ state: 'frozen', ySplit: 2 }];
}

function addRow(sheet: ExcelJS.Worksheet, rowIndex: number, isParceiro: boolean, values: Record<string, string>) {
    const row = sheet.addRow(values);
    const zebra = rowIndex % 2 === 0 ? COLORS.bgCard : COLORS.bgTertiary;
    row.eachCell((cell) => {
        cell.font = {
            name: 'Calibri',
            size: 11,
            color: { argb: isParceiro ? COLORS.textMuted : COLORS.textPrimary },
            italic: isParceiro,
        };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebra } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: isParceiro ? 1 : 0 };
        cell.border = { bottom: { style: 'thin', color: { argb: COLORS.border } } };
    });
    return row;
}

export async function buildInscricoesWorkbook(
    campeonatoNome: string,
    inscricoes: Inscricao[],
): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CrossFit Home';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Inscrições');
    styleSheet(sheet, `Inscrições — ${campeonatoNome}`);

    let rowIndex = 0;

    for (const inscricao of inscricoes) {
        const cidade = ResponseInscricaoDto.resolveCidade(inscricao) ?? '';
        const telefone = ResponseInscricaoDto.resolvePhone(inscricao) ?? '';

        rowIndex++;
        addRow(sheet, rowIndex, false, {
            tipo: 'Atleta',
            nome: inscricao.nomeAtleta ?? '',
            email: inscricao.email ?? '',
            categoria: inscricao.categoria ?? '',
            cidade,
            telefone,
        });

        for (const parceiro of inscricao.parceiros ?? []) {
            rowIndex++;
            addRow(sheet, rowIndex, true, {
                tipo: 'Parceiro',
                nome: parceiro.nome ?? '',
                email: inscricao.email ?? '',
                categoria: inscricao.categoria ?? '',
                cidade,
                telefone: parceiro.telefone || telefone,
            });
        }
    }

    return workbook.xlsx.writeBuffer();
}
