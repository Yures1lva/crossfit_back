import { PartialType } from '@nestjs/mapped-types';
import { CreateBateriaDto } from './create-bateria.dto';

export class UpdateBateriaDto extends PartialType(CreateBateriaDto) {}
