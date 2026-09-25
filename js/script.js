const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const prioritySelect = document.getElementById('task-priority');
const dateInput = document.getElementById('task-date');
const formError = document.getElementById('form-error');

const taskList = document.getElementById('task-list');
const counterEl = document.getElementById('task-counter');
const emptyState = document.getElementById('empty-state');

const filterButtons = document.querySelectorAll('.filter');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('.theme-toggle__icon');
const themeLabel = themeToggle.querySelector('.theme-toggle__label');

let tasks = [];
let currentFilter = 'todas';

const TAREFAS_INICIAIS = [
  { id: criarId(), title: 'Fazer trabalho de matemática', priority: 'alta', dueDate: '2026-09-25', done: false },
  { id: criarId(), title: 'Estudar HTML', priority: 'media', dueDate: '', done: false },
  { id: criarId(), title: 'Revisar conteúdo de CSS', priority: 'baixa', dueDate: '', done: true },
];

function criarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function infoPrioridade(priority) {
  const mapa = {
    alta:  { texto: 'Prioridade alta',  classe: 'badge--alta' },
    media: { texto: 'Prioridade média', classe: 'badge--media' },
    baixa: { texto: 'Prioridade baixa', classe: 'badge--baixa' },
  };
  return mapa[priority] || mapa.media;
}

function formatarData(isoDate) {
  if (!isoDate) return '';
  const [ano, mes, dia] = isoDate.split('-');
  return `${dia}/${mes}/${ano}`;
}

const CHAVE_TAREFAS = 'taskflow:tasks';

function salvarTarefas() {
  localStorage.setItem(CHAVE_TAREFAS, JSON.stringify(tasks));
}

function carregarTarefas() {
  const salvas = localStorage.getItem(CHAVE_TAREFAS);

  if (salvas) {
    try {
      tasks = JSON.parse(salvas);
      return;
    } catch (erro) {
      console.error('Não foi possível ler as tarefas salvas:', erro);
    }
  }

  tasks = [];
}

function render() {
  const tarefasFiltradas = tasks.filter((tarefa) => {
    if (currentFilter === 'pendentes') return !tarefa.done;
    if (currentFilter === 'concluidas') return tarefa.done;
    return true;
  });

  taskList.innerHTML = '';

  tarefasFiltradas.forEach((tarefa) => {
    taskList.appendChild(criarElementoTarefa(tarefa));
  });

  emptyState.hidden = tarefasFiltradas.length > 0;

  atualizarContador();
}

function criarElementoTarefa(tarefa) {
  const info = infoPrioridade(tarefa.priority);

  const li = document.createElement('li');
  li.className = 'task';
  if (tarefa.done) li.classList.add('task--done');
  li.dataset.id = tarefa.id;

  const check = document.createElement('label');
  check.className = 'task__check';
  check.innerHTML = `
    <input class="task__checkbox" type="checkbox" ${tarefa.done ? 'checked' : ''}
           aria-label="Marcar como concluída: ${escaparTexto(tarefa.title)}">
    <span class="task__box" aria-hidden="true"></span>
  `;

  const body = document.createElement('div');
  body.className = 'task__body';

  const title = document.createElement('p');
  title.className = 'task__title';
  title.textContent = tarefa.title;

  const meta = document.createElement('p');
  meta.className = 'task__meta';

  const badge = document.createElement('span');
  badge.className = `badge ${info.classe}`;
  badge.textContent = info.texto;
  meta.appendChild(badge);

  if (tarefa.dueDate) {
    const time = document.createElement('time');
    time.className = 'task__date';
    time.dateTime = tarefa.dueDate;
    time.textContent = `Entrega: ${formatarData(tarefa.dueDate)}`;
    meta.appendChild(time);
  }

  body.appendChild(title);
  body.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'task__actions';
  actions.innerHTML = `
    <button class="action-btn task__edit" type="button" aria-label="Editar tarefa: ${escaparTexto(tarefa.title)}">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
      <span>Editar</span>
    </button>
    <button class="action-btn action-btn--danger task__delete" type="button" aria-label="Excluir tarefa: ${escaparTexto(tarefa.title)}">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>Excluir</span>
    </button>
  `;

  li.appendChild(check);
  li.appendChild(body);
  li.appendChild(actions);

  return li;
}

function escaparTexto(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function atualizarContador() {
  const pendentes = tasks.filter((tarefa) => !tarefa.done).length;
  counterEl.textContent = pendentes === 1
    ? '1 tarefa pendente'
    : `${pendentes} tarefas pendentes`;
}

function adicionarTarefa(evento) {
  evento.preventDefault();

  const titulo = input.value.trim();

  if (!titulo) {
    formError.hidden = false;
    input.focus();
    return;
  }

  formError.hidden = true;

  tasks.push({
    id: criarId(),
    title: titulo,
    priority: prioritySelect.value,
    dueDate: dateInput.value,
    done: false,
  });

  salvarTarefas();
  render();

  form.reset();
  input.focus();
}

function alternarConcluida(id) {
  const tarefa = tasks.find((t) => t.id === id);
  if (!tarefa) return;

  tarefa.done = !tarefa.done;
  salvarTarefas();
  render();
}

function excluirTarefa(id) {
  const tarefa = tasks.find((t) => t.id === id);
  if (!tarefa) return;

  const confirmou = confirm(`Excluir a tarefa "${tarefa.title}"?`);
  if (!confirmou) return;

  tasks = tasks.filter((t) => t.id !== id);
  salvarTarefas();
  render();
}

function editarTarefa(id) {
  const tarefa = tasks.find((t) => t.id === id);
  if (!tarefa) return;

  const novoTitulo = prompt('Editar tarefa:', tarefa.title);

  if (novoTitulo === null) return;

  const tituloLimpo = novoTitulo.trim();
  if (!tituloLimpo) return;

  tarefa.title = tituloLimpo;
  salvarTarefas();
  render();
}

function definirFiltro(filtro, botaoClicado) {
  currentFilter = filtro;

  filterButtons.forEach((botao) => {
    const ativo = botao === botaoClicado;
    botao.classList.toggle('is-active', ativo);
    botao.setAttribute('aria-pressed', String(ativo));
  });

  render();
}

const CHAVE_TEMA = 'taskflow:theme';

function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);

  const escuro = tema === 'dark';
  themeIcon.textContent = escuro ? '☀️' : '🌙';
  themeLabel.textContent = escuro ? 'Tema claro' : 'Tema escuro';
  themeToggle.setAttribute(
    'aria-label',
    escuro ? 'Mudar para tema claro' : 'Mudar para tema escuro'
  );
}

function alternarTema() {
  const temaAtual = document.documentElement.getAttribute('data-theme');
  const novoTema = temaAtual === 'dark' ? 'light' : 'dark';

  aplicarTema(novoTema);
  localStorage.setItem(CHAVE_TEMA, novoTema);
}

function carregarTema() {
  const salvo = localStorage.getItem(CHAVE_TEMA);

  const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const tema = salvo || (prefereEscuro ? 'dark' : 'light');

  aplicarTema(tema);
}

form.addEventListener('submit', adicionarTarefa);

taskList.addEventListener('click', (evento) => {
  const li = evento.target.closest('.task');
  if (!li) return;

  const id = li.dataset.id;

  if (evento.target.closest('.task__delete')) {
    excluirTarefa(id);
  } else if (evento.target.closest('.task__edit')) {
    editarTarefa(id);
  }
});

taskList.addEventListener('change', (evento) => {
  if (!evento.target.classList.contains('task__checkbox')) return;

  const li = evento.target.closest('.task');
  if (li) alternarConcluida(li.dataset.id);
});

filterButtons.forEach((botao) => {
  botao.addEventListener('click', () => definirFiltro(botao.dataset.filter, botao));
});

themeToggle.addEventListener('click', alternarTema);

carregarTema();
carregarTarefas();
render();
