/**
 * Seed único: popula o campeonato de teste "aaaaa" com os 3 eventos reais do
 * "Só o Aço Games 2026" (tarefas, timecaps e categorias tirados dos posts do Instagram).
 * Roda direto no banco via MikroORM (não usa a API/HTTP, não precisa de login).
 *
 * Uso: cd crossfit_back && npx ts-node scripts/seed-so-o-aco-2026.ts
 */
import { MikroORM } from '@mikro-orm/postgresql';
import config from '../src/mikro-orm.config';
import { Campeonato } from '../src/campeonato/entities/campeonato.entity';
import { Prova, TipoValorProva, SexoProva } from '../src/prova/entities/prova.entity';

const CAMPEONATO_SLUG = 'aaaaa';

interface ProvaSeed {
  ordem: number;
  nome: string;
  categorias: string[];
  cor: string;
  horaInicio: string;
  timecap: string;
  tarefas: string[];
  tipoValor?: TipoValorProva;
  menorVence?: boolean;
}

const PROVAS: ProvaSeed[] = [
  // ── EVENTO 01 ──────────────────────────────────────────
  {
    ordem: 10, nome: 'EVENTO 01', categorias: ['Iniciante'], cor: '#D9DD6E',
    horaInicio: '08:00', timecap: '18:00',
    tarefas: [
      '2 rounds for time:',
      '30 Hand Release Push-ups (02 syncro)',
      '60 Hang Snatch (75/53 lb)',
      '90 Wall Ball (14/08 lb) (02 syncro)',
    ],
  },
  {
    ordem: 10, nome: 'EVENTO 01', categorias: ['Scaled'], cor: '#D9DD6E',
    horaInicio: '08:00', timecap: '18:00',
    tarefas: [
      '2 rounds for time:',
      '30 Kipping Pull-ups (02 syncro)',
      '60 Hang Snatch (75/53 lb)',
      '90 Wall Ball (20/14 lb) (02 syncro)',
    ],
  },
  {
    ordem: 10, nome: 'EVENTO 01', categorias: ['Intermediário', 'Master 40+'], cor: '#D9DD6E',
    horaInicio: '08:00', timecap: '22:00',
    tarefas: [
      'For time:',
      '2.000/1.600 meter row',
      '2.000/1.600 meter run (5/4 voltas de 400m)',
    ],
  },
  {
    ordem: 10, nome: 'EVENTO 01', categorias: ['RX', 'Master 35+'], cor: '#D9DD6E',
    horaInicio: '08:00', timecap: '35:00',
    tarefas: [
      '5 rounds for time:',
      '100 meter swim',
      '400 meter run',
    ],
  },

  // ── EVENTO 02 ──────────────────────────────────────────
  {
    ordem: 20, nome: 'EVENTO 02', categorias: ['Iniciante'], cor: '#3B82F6',
    horaInicio: '09:30', timecap: '10:00',
    tarefas: [
      '3 rounds for time:',
      '40 meter sled pull (♂ 1 round cada atleta / ♀ 2 meninas na corda)',
      '10 burpees over the rope (syncro)',
    ],
  },
  {
    ordem: 20, nome: 'EVENTO 02', categorias: ['Scaled'], cor: '#3B82F6',
    horaInicio: '09:30', timecap: '10:00',
    tarefas: [
      '3 rounds for time:',
      '40 meter sled pull (1 round cada atleta)',
      '10 burpees over the rope (syncro)',
    ],
  },
  {
    ordem: 20, nome: 'EVENTO 02', categorias: ['Intermediário', 'Master 40+'], cor: '#3B82F6',
    horaInicio: '09:30', timecap: '2:00',
    tarefas: [
      'For time — Clean speed ladder:',
      '♀ 1x123 / 133 / 143 / 153 / 163 lb',
      '♂ 1x174 / 184 / 204 / 224 / 235 lb',
    ],
  },
  {
    ordem: 20, nome: 'EVENTO 02', categorias: ['RX', 'Master 35+'], cor: '#3B82F6',
    horaInicio: '09:30', timecap: '2:00',
    tarefas: [
      'For time — Clean speed ladder:',
      '1x204 / 224 / 244 / 264 / 274 lb',
    ],
  },

  // ── EVENTO 03 ──────────────────────────────────────────
  {
    ordem: 30, nome: 'EVENTO 03', categorias: ['Iniciante'], cor: '#22C55E',
    horaInicio: '11:00', timecap: '7:00',
    tarefas: [
      'For time:',
      '45 Shoulder to Overhead (75/53 lb)',
      '45 Clean (95/63 lb)',
      '45 Deadlift (205/153 lb) (2 na barra)',
    ],
  },
  {
    ordem: 30, nome: 'EVENTO 03', categorias: ['Scaled'], cor: '#22C55E',
    horaInicio: '11:00', timecap: '7:00',
    tarefas: [
      'For time:',
      '60 Shoulder to Overhead (95/63 lb)',
      '60 Clean (125/83 lb)',
      '60 Deadlift (235/173 lb) (2 na barra)',
    ],
  },
  {
    ordem: 30, nome: 'EVENTO 03', categorias: ['Intermediário', 'Master 40+'], cor: '#22C55E',
    horaInicio: '11:00', timecap: '15:00',
    tarefas: [
      'E3MOM3 por 12 minutos (4 rounds), depois 1 round for time:',
      '2 rope climb',
      '5 SHSPU',
      '5 BMU',
      '9 single arm dumbbell step up over',
      '11 SU sisal',
      'Finish line',
    ],
  },
  {
    ordem: 30, nome: 'EVENTO 03', categorias: ['RX', 'Master 35+'], cor: '#22C55E',
    horaInicio: '11:00', timecap: '15:00',
    tarefas: [
      'E3MOM3 por 12 minutos (4 rounds), depois 1 round for time:',
      '2 legless',
      '5 parallette HSPU',
      '7 BMU',
      '9 single arm dumbbell step up over (50 lb)',
      '11 DU crossover',
      'Finish line',
    ],
  },
];

async function main() {
  const orm = await MikroORM.init(config);
  const em = orm.em.fork();

  const campeonato = await em.findOne(Campeonato, { slug: CAMPEONATO_SLUG });
  if (!campeonato) throw new Error(`Campeonato "${CAMPEONATO_SLUG}" não encontrado`);

  // Garante que "Scaled" existe na modalidade Individual (necessário pros WODs de Scaled)
  // Reconstrói o array/objetos (novas referências) pra garantir que o MikroORM detecte a mudança no campo JSON.
  const modalidades = (campeonato.modalidades || []).map((m) => {
    if (m.nome !== 'Individual') return { ...m };
    const categorias = [...m.categorias];
    if (!categorias.includes('Scaled Masculino')) categorias.push('Scaled Masculino');
    if (!categorias.includes('Scaled Feminino')) categorias.push('Scaled Feminino');
    return { ...m, categorias };
  });
  campeonato.modalidades = modalidades;

  let criadas = 0;
  for (const p of PROVAS) {
    const prova = new Prova();
    prova.campeonato = campeonato;
    prova.nome = p.nome;
    prova.categorias = p.categorias;
    prova.sexo = SexoProva.AMBOS;
    prova.cor = p.cor;
    prova.horaInicio = p.horaInicio;
    prova.timecap = p.timecap;
    prova.tarefas = p.tarefas;
    prova.tipoValor = p.tipoValor ?? TipoValorProva.TEMPO;
    prova.menorVence = p.menorVence ?? true;
    prova.ordem = p.ordem;
    em.persist(prova);
    criadas++;
  }

  await em.flush();
  console.log(`OK — ${criadas} provas criadas no campeonato "${CAMPEONATO_SLUG}", categoria "Scaled" adicionada ao Individual.`);
  await orm.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
