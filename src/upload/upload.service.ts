import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
    private readonly uploadDir = path.join(process.cwd(), 'public', 'uploads');

    constructor() {
        // Garante que o diretório existe
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async saveFile(
        file: Express.Multer.File,
        subfolder: string = 'geral',
    ): Promise<string> {
        const subDir = path.join(this.uploadDir, subfolder);
        if (!fs.existsSync(subDir)) {
            fs.mkdirSync(subDir, { recursive: true });
        }

        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        const filepath = path.join(subDir, filename);

        fs.writeFileSync(filepath, file.buffer);

        return `/uploads/${subfolder}/${filename}`;
    }
}
