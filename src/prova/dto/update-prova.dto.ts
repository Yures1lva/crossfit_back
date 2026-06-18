import { PartialType } from '@nestjs/mapped-types';
import { CreateProvaDto } from './create-prova.dto';

export class UpdateProvaDto extends PartialType(CreateProvaDto) {}
