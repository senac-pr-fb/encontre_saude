/**
 * pre_prontuario.js
 * Lógica do formulário multi-step de Pré-Prontuário — Encontre Saúde
 */

import { createSidebar } from './../../shared/sidebar.js';
import { profileService } from '../../Services/profileService.js';
import { chatService } from '../../Services/chatService.js';
import { authService } from '../../Services/authService.js';

// ─── Inicialização da Sidebar ─────────────────────────────────────────────────
createSidebar();

// ─── Estado do Formulário ─────────────────────────────────────────────────────
let currentStep = 1;
const TOTAL_STEPS = 4;
let isFromHistory = false; // Flag para saber se viemos do histórico (evita duplicidade)

// Função para preencher o formulário automaticamente com dados do Supabase
async function carregarDadosAutomaticos() {
  console.group("🏥 [Pré-Prontuário] Carregando dados automáticos...");

  // 1. Verifica se está logado
  const { session, user } = await authService.getUserSession();
  if (!session) {
    console.warn("Usuário não logado. Pulando carregamento automático.");
    console.groupEnd();
    return;
  }

  // Preenche o nome se disponível na sessão
  if (user && user.user_metadata) {
    const nomeCompleto = user.user_metadata.full_name || user.user_metadata.name;
    if (nomeCompleto) {
      const campoNome = document.getElementById('nome');
      if (campoNome && !campoNome.value) campoNome.value = nomeCompleto;
    }
  }

  // 2. Busca dados do Perfil
  const { profile } = await profileService.getProfile();
  if (profile) {
    console.log("Preenchendo dados do perfil...");
    if (profile.sexo) document.getElementById('sexo').value = profile.sexo;
    if (profile.peso) document.getElementById('peso').value = profile.peso;
    if (profile.altura) document.getElementById('altura').value = profile.altura;
    if (profile.CPF) document.getElementById('cpf').value = profile.CPF;
    if (profile.data_nascimento) document.getElementById('dataNascimento').value = profile.data_nascimento;
    if (profile.telefone) document.getElementById('telefone').value = profile.telefone;
  }

  // 3. Busca última consulta da IA
  const { data: consulta } = await chatService.getLatestFullConsultation();
  if (consulta) {
    console.log("Preenchendo dados da última consulta IA...");

    // Queixa Principal
    if (consulta.chat.descricao_usuario) {
      document.getElementById('queixaPrincipal').value = consulta.chat.descricao_usuario;
    }

    // Sintomas (Checkboxes)
    if (consulta.symptoms) {
      const keys = Object.keys(consulta.symptoms);
      keys.forEach(key => {
        if (consulta.symptoms[key] === true) {
          const checkbox = document.querySelector(`input[name="sintomas"][value="${key}"]`);
          if (checkbox) checkbox.checked = true;
        }
      });
    }
  }

  console.log("Carregamento automático finalizado!");
  console.groupEnd();
}

// Inicializa o carregamento
document.addEventListener('DOMContentLoaded', carregarDadosAutomaticos);

// ─── Elementos DOM ────────────────────────────────────────────────────────────
const form = document.getElementById('pp-form');
const btnNext = document.getElementById('btn-next');
const btnBack = document.getElementById('btn-back');
const btnDownload = document.getElementById('btn-download');
const toast = document.getElementById('pp-toast');
const toastIcon = document.getElementById('toast-icon');
const toastMsg = document.getElementById('toast-msg');

// ─── Máscara de CPF ───────────────────────────────────────────────────────────
document.getElementById('cpf')?.addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{3})/, '$1.$2');
  this.value = v;
});

// ─── Máscara de Telefone ──────────────────────────────────────────────────────
document.getElementById('telefone')?.addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
  else if (v.length > 2) v = v.replace(/(\d{2})(\d+)/, '($1) $2');
  this.value = v;
});

// ─── Carregar Dados da IA ───────────────────────────────────────────────────
function carregarDadosIA() {
  const dadosBrutos = localStorage.getItem('ultimaTriagemIA');
  if (!dadosBrutos) return;

  try {
    const dados = JSON.parse(dadosBrutos);
    const agora = Date.now();
    const VINTE_MINUTOS = 20 * 60 * 1000;

    // Só usa se for recente (menos de 20 minutos)
    if (agora - dados.timestamp < VINTE_MINUTOS) {
      const field = document.getElementById('queixaPrincipal');
      if (field && !field.value) { // Só preenche se estiver vazio
        const { textoUsuario, resultadoIA } = dados;

        field.value = `RELATO DO PACIENTE: ${textoUsuario}\n\n` +
          `ANÁLISE IA (Nível ${resultadoIA.nivel}): ${resultadoIA.resumo}\n` +
          `RECOMENDAÇÃO: ${resultadoIA.recomendacao}`;

        // Dispara evento de input para validar o campo se necessário
        field.dispatchEvent(new Event('input'));
      }
    }
  } catch (e) {
    console.error("Erro ao carregar dados da IA:", e);
  }
}

// ─── Salvamento Automático (Auto-Save) ─────────────────────────────────────────
const STORAGE_KEY = 'rascunhoPreProntuario';

function salvarProgresso() {
  const formData = new FormData(form);
  const data = {};

  formData.forEach((value, key) => {
    // Lidar com múltiplos checkboxes (como 'sintomas')
    if (data[key]) {
      if (!Array.isArray(data[key])) data[key] = [data[key]];
      data[key].push(value);
    } else {
      data[key] = value;
    }
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    data,
    currentStep,
    timestamp: Date.now()
  }));
}

function carregarProgresso() {
  const rascunho = localStorage.getItem(STORAGE_KEY);
  if (!rascunho) return;

  try {
    const saved = JSON.parse(rascunho);
    const data = saved.data;
    const step = saved.currentStep || saved.step;
    isFromHistory = saved.isFromHistory || false; // Recupera a flag

    // Preenche campos de texto, select, etc.
    Object.keys(data).forEach(key => {
      const val = data[key];
      const element = form.elements[key];

      if (!element) return;

      // Se for um grupo de elementos (como checkboxes ou radios com o mesmo nome)
      if (element instanceof RadioNodeList) {
        if (Array.isArray(val)) {
          console.log(`🔍 [Pré-Prontuário] Preenchendo checkboxes para ${key}:`, val);
          element.forEach(el => {
            if (el.type === 'checkbox') {
              el.checked = val.includes(el.value);
            }
          });
        } else {
          // Caso de radios
          element.forEach(el => {
            if (el.type === 'radio') el.checked = el.value === val;
          });
        }
      } else if (element.type === 'checkbox') {
        // Checkbox único
        element.checked = !!val;
      } else {
        // Campos de texto, select, etc.
        element.value = val;
      }

      if (element instanceof HTMLElement || element instanceof RadioNodeList) {
        const firstEl = element instanceof RadioNodeList ? element[0] : element;
        firstEl?.dispatchEvent(new Event('input', { bubbles: true }));
        firstEl?.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Atualiza o resumo antes de ir para o passo 4
    atualizarResumo();

    // Restaura o passo se necessário
    if (step && step > 1) {
      console.log(`🚀 [Pré-Prontuário] Restaurando passo ${step} do rascunho.`);
      irParaStep(step);
    }
  } catch (e) {
    console.error("Erro ao carregar rascunho:", e);
  }
}

function limparRascunho() {
  localStorage.removeItem(STORAGE_KEY);
}

// Ouvinte para salvar a cada mudança
form.addEventListener('input', () => salvarProgresso());
form.addEventListener('change', () => salvarProgresso());

// ─── Carregar Dados ao Iniciar ────────────────────────────────────────────────
carregarProgresso();
carregarDadosIA();

document.querySelectorAll('input[name="canalEnvio"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    const isEmail = radio.value === 'email';
    const isWhatsApp = radio.value === 'whatsapp';

    document.getElementById('campo-email').style.display = isEmail ? 'block' : 'none';
    document.getElementById('campo-whatsapp').style.display = isWhatsApp ? 'block' : 'none';

    // Limpa o campo do canal que não foi selecionado
    if (isEmail) document.getElementById('whatsapp').value = '';
    if (isWhatsApp) document.getElementById('email').value = '';

    limparErro('canalEnvio');
  });
});

// ─── Clique na Barra de Progresso ───────────────────────────────────────────
document.querySelectorAll('.pp-step').forEach((stepEl) => {
  stepEl.addEventListener('click', () => {
    const targetStep = parseInt(stepEl.id.replace('progress-step-', ''));
    if (isNaN(targetStep)) return;

    if (targetStep === currentStep) return;

    if (targetStep < currentStep) {
      irParaStep(targetStep);
    } else {
      // Tentar avançar: validar todos os passos intermediários
      let canGo = true;
      let stepComErro = currentStep;

      for (let i = currentStep; i < targetStep; i++) {
        if (!validarStep(i)) {
          canGo = false;
          stepComErro = i;
          break;
        }
      }

      if (canGo) {
        irParaStep(targetStep);
      } else {
        // Se não puder ir, avisa o usuário e vai para o primeiro step com erro
        mostrarToast('error', '<i class="fas fa-exclamation-circle"></i>', 'Preencha os campos obrigatórios antes de avançar.');
        if (stepComErro !== currentStep) {
          irParaStep(stepComErro);
        }
      }
    }
  });
});

// ─── Validação por Step ───────────────────────────────────────────────────────
function validarStep(step) {
  let valido = true;

  if (step === 1) {
    valido = validarCampo('nome', (v) => v.trim().length >= 3, 'Nome deve ter pelo menos 3 caracteres.') && valido;
    valido = validarCampo('dataNascimento', (v) => !!v, 'Informe a data de nascimento.') && valido;
    valido = validarCampo('cpf', (v) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(v), 'CPF inválido. Use: 000.000.000-00') && valido;
    valido = validarCampo('sexo', (v) => !!v, 'Selecione o sexo biológico.') && valido;
    valido = validarCampo('telefone', (v) => v.replace(/\D/g, '').length >= 10, 'Telefone inválido.') && valido;
  }

  if (step === 2) {
    valido = validarCampo('queixaPrincipal', (v) => v.trim().length >= 10, 'Descreva a queixa com pelo menos 10 caracteres.') && valido;
  }

  if (step === 4) {
    const canal = document.querySelector('input[name="canalEnvio"]:checked')?.value;
    if (!canal) {
      mostrarErro('canalEnvio', 'Selecione como deseja receber o documento.');
      valido = false;
    } else if (canal === 'email') {
      valido = validarCampo('email', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'E-mail inválido.') && valido;
    } else if (canal === 'whatsapp') {
      valido = validarCampo('whatsapp', (v) => v.replace(/\D/g, '').length >= 11, 'Número inválido. Inclua o +55 e DDD.') && valido;
    }
  }

  return valido;
}

function validarCampo(id, regra, mensagem) {
  const el = document.getElementById(id);
  if (!el) return true;
  const ok = regra(el.value);
  ok ? marcarValido(id) : mostrarErro(id, mensagem);
  return ok;
}

function mostrarErro(id, mensagem) {
  const el = document.getElementById(id);
  const erro = document.getElementById(`erro-${id}`);
  if (el) el.classList.add('error');
  if (erro) erro.textContent = `⚠️ ${mensagem}`;
}

function marcarValido(id) {
  const el = document.getElementById(id);
  const erro = document.getElementById(`erro-${id}`);
  if (el) { el.classList.remove('error'); el.classList.add('valid'); }
  if (erro) erro.textContent = '';
}

function limparErro(id) {
  const erro = document.getElementById(`erro-${id}`);
  if (erro) erro.textContent = '';
}

// ─── Navegação entre Steps ────────────────────────────────────────────────────
function irParaStep(novoStep) {
  // Oculta todos os steps primeiro (segurança)
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    document.getElementById(`step-${i}`)?.classList.remove('active');
  }

  // Ativa o novo step
  document.getElementById(`step-${novoStep}`)?.classList.add('active');

  // Atualiza a Barra de Progresso visualmente
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const stepEl = document.getElementById(`progress-step-${i}`);
    const line = document.getElementById(`line-${i}-${i + 1}`);

    if (i < novoStep) {
      stepEl?.classList.remove('active');
      stepEl?.classList.add('done');
      line?.classList.add('done');
    } else if (i === novoStep) {
      stepEl?.classList.remove('done');
      stepEl?.classList.add('active');
      line?.classList.remove('done');
    } else {
      stepEl?.classList.remove('active', 'done');
      line?.classList.remove('done');
    }
  }

  currentStep = novoStep;

  // Atualiza botões
  btnBack.style.visibility = currentStep === 1 ? 'hidden' : 'visible';

  const isLastStep = currentStep === TOTAL_STEPS;
  btnNext.style.display = isLastStep ? 'none' : 'flex';

  // Ao chegar no step 4, preenche o resumo
  if (currentStep === 4) preencherResumo();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

btnNext.addEventListener('click', () => {
  if (validarStep(currentStep) && currentStep < TOTAL_STEPS) {
    irParaStep(currentStep + 1);
  }
});

btnBack.addEventListener('click', () => {
  if (currentStep > 1) {
    // Remove classe done do step atual ao voltar
    const stepEl = document.getElementById(`progress-step-${currentStep}`);
    if (stepEl) { stepEl.classList.remove('active'); stepEl.classList.remove('done'); }
    const line = document.getElementById(`line-${currentStep - 1}-${currentStep}`);
    if (line) line.classList.remove('done');
    irParaStep(currentStep - 1);
  }
});

// ─── Preenchimento do Resumo ──────────────────────────────────────────────────
function preencherResumo() {
  const resumo = document.getElementById('resumo-content');
  if (!resumo) return;

  const sintomas = [...document.querySelectorAll('input[name="sintomas"]:checked')].map((c) => c.value);

  const campos = [
    { label: 'Nome', valor: val('nome') },
    { label: 'Nascimento', valor: formatarData(val('dataNascimento')) },
    { label: 'Sexo', valor: val('sexo') },
    { label: 'Queixa Principal', valor: val('queixaPrincipal')?.slice(0, 60) + (val('queixaPrincipal')?.length > 60 ? '...' : '') },
    { label: 'Sintomas', valor: sintomas.length ? sintomas.join(', ') : 'Nenhum marcado' },
    { label: 'Pressão Arterial', valor: val('pressaoArterial') || '—' },
  ];

  resumo.innerHTML = campos.map((c) => `
    <div class="pp-resumo-item">
      <span>${c.label}</span>
      <span>${c.valor || '—'}</span>
    </div>
  `).join('');
}

function val(id) { return document.getElementById(id)?.value || ''; }
function formatarData(d) {
  if (!d) return '—';
  const [a, m, dia] = d.split('-');
  return `${dia}/${m}/${a}`;
}

// ─── Geração de PDF Nativa Vetorial ───────────────────────────────────────────
async function gerarArquivoPDFPuro(btnElement, onCompleteMessage) {
  const originalText = btnElement.innerHTML;
  btnElement.disabled = true;
  btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando Documento...';

  try {
    const nomeSafe = (val('nome') || 'paciente').replace(/\s+/g, '-').toLowerCase();

    // Carrega o motor vetorial nativo (jsPDF) dinamicamente sem afetar o HTML
    if (!window.jspdf) {
      await new Promise((r, j) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = r;
        s.onerror = j;
        document.head.appendChild(s);
      });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Fundo Verde Superior
    doc.setFillColor(12, 74, 69); // #0c4a45
    doc.rect(0, 0, 210, 30, 'F');
    // Linha de Detalhe #14b8a6
    doc.setDrawColor(20, 184, 166);
    doc.setLineWidth(1.5);
    doc.line(0, 30, 210, 30);

    // Titulo e Subtitulo
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("ENCONTRE SAÚDE", 15, 15);
    doc.setTextColor(20, 184, 166);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Pré-Prontuário Digital | Documento Confidencial", 15, 22);

    // Data Atual
    const d = new Date();
    const dataH = d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.setTextColor(203, 213, 225);
    doc.text("Gerado em: " + dataH, 195, 15, { align: 'right' });

    let y = 40;

    function createSessionHeader(title) {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFillColor(13, 148, 136); // #0d9488
      doc.rect(15, y, 180, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, 18, y + 5.5);
      y += 15;
    }

    function createProp(label, value, x, w) {
      doc.setTextColor(100, 116, 139); // TextSlate
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(label, x, y);

      doc.setTextColor(15, 23, 42); // BoldSlate
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const strArr = doc.splitTextToSize(value || '—', w);
      doc.text(strArr, x, y + 5);
      return strArr.length * 5;
    }

    // Seç 1: Pessoais
    createSessionHeader("Dados Pessoais");
    const npNasc = val('dataNascimento') ? val('dataNascimento').split('-').reverse().join('/') : '—';
    createProp("Nome", val('nome') || '—', 15, 85);
    createProp("Nascimento", npNasc, 110, 85);
    y += 12;
    createProp("CPF", val('cpf') || '—', 15, 85);
    createProp("Sexo", val('sexo') || '—', 110, 85);
    y += 12;
    createProp("Telefone", val('telefone') || '—', 15, 85);
    y += 18;

    // Seç 2: Sintomas
    createSessionHeader("Sintomas");
    y += createProp("Queixa Principal", val('queixaPrincipal') || '—', 15, 180) + 5;

    const mk = Array.from(document.querySelectorAll('input[type="checkbox"][name="sintomas"]:checked'));
    const smk = mk.length ? mk.map(m => m.parentNode.textContent.trim()).join(', ') : 'Nenhum sintoma selecionado.';
    y += createProp("Sintomas Selecionados", smk, 15, 180) + 12;

    // Seç 3: Histórico e Sinais
    createSessionHeader("Histórico Clínico e Sinais Vitais");
    createProp("Alergias", val('alergias') || '—', 15, 85);
    createProp("Medicamentos em uso", val('medicamentosEmUso') || '—', 110, 85);
    y += 12;
    createProp("Doenças Preexistentes", val('doencasPreexistentes') || '—', 15, 85);
    createProp("Histórico Familiar", val('historicoFamiliar') || '—', 110, 85);
    y += 15;

    const vpa = val('pressaoArterial') ? val('pressaoArterial') + ' mmHg' : '—';
    const vfc = val('frequenciaCardiaca') ? val('frequenciaCardiaca') + ' bpm' : '—';
    const vtp = val('temperatura') ? val('temperatura') + ' °C' : '—';
    const vso = val('saturacaoOxigenio') ? val('saturacaoOxigenio') + ' %' : '—';

    doc.setDrawColor(226, 232, 240);
    createProp("Pressão Arterial", vpa, 15, 55);
    createProp("Frequência Card.", vfc, 75, 55);
    createProp("Temperatura", vtp, 135, 55);
    y += 12;
    createProp("Saturação O2", vso, 15, 55);
    const pP = val('peso'), aA = val('altura');
    createProp("Peso / Altura", (pP || aA) ? `${pP || '--'}kg / ${aA || '--'}cm` : '—', 75, 55);
    y += 18;

    createProp("Observações Adicionais", val('observacoesAdicionais') || '—', 15, 180);

    // Footer Base
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Este documento confidencial não substitui uma consulta médica presencial. — Encontre Saúde", 105, 285, { align: 'center' });

    // Download PDF (100% Client-Side)
    doc.save(`pre-prontuario-${nomeSafe}.pdf`);

    mostrarToast('success', '<i class="fas fa-check-circle"></i>', onCompleteMessage);
  } catch (err) {
    console.error('Erro ao gerar o PDF autônomo:', err);
    mostrarToast('error', '<i class="fas fa-triangle-exclamation"></i>', 'Erro inesperado ao gerar PDF no navegador.');
  } finally {
    btnElement.disabled = false;
    btnElement.innerHTML = originalText;
  }
}

// ─── Finalização (Salvar no Banco + Gerar PDF) ───────────────────────────────
btnDownload?.addEventListener('click', async () => {
  // Valida passos obrigatórios antes de prosseguir
  if (!validarStep(1) || !validarStep(2)) {
    mostrarToast('error', '<i class="fas fa-triangle-exclamation"></i>', 'Preencha os dados obrigatórios nos passos 1 e 2.');
    irParaStep(!validarStep(1) ? 1 : 2);
    return;
  }

  const originalText = btnDownload.innerHTML;
  btnDownload.disabled = true;
  btnDownload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando e Gerando...';

  // 1. Coleta os sintomas marcados na tela para salvar no banco
  const sintomasSelecionados = {};
  document.querySelectorAll('input[name="sintomas"]').forEach(cb => {
    sintomasSelecionados[cb.value] = cb.checked;
  });

  // 2. Coleta dados clínicos (opcionais) para salvar
  const dadosClinicos = {
    alergias: val('alergias'),
    medicamentos: val('medicamentosEmUso'),
    doencas: val('doencasPreexistentes'),
    historico_familiar: val('historicoFamiliar'),
    pressao: val('pressaoArterial'),
    freq_cardiaca: val('frequenciaCardiaca'),
    temperatura: val('temperatura'),
    saturacao: val('saturacaoOxigenio'),
    peso: val('peso'),
    altura: val('altura'),
    observacoes: val('observacoesAdicionais')
  };

  // 3. Salva no Supabase (Histórico + Sintomas + Dados Clínicos) - APENAS se NÃO vier do histórico
  const queixa = document.getElementById('queixaPrincipal').value;

  if (!isFromHistory) {
    console.log("📝 [Pré-Prontuário] Iniciando salvamento da consulta manual...");
    const consultationRes = await chatService.saveManualConsultation(queixa, sintomasSelecionados, JSON.stringify(dadosClinicos));

    if (consultationRes.error) {
      console.error("❌ [Pré-Prontuário] Erro ao salvar histórico:", consultationRes.error);
    } else {
      console.log("✅ [Pré-Prontuário] Histórico salvo com sucesso!", consultationRes.data);
    }
  } else {
    console.log("⏭️ [Pré-Prontuário] Pulando salvamento de histórico (Origem: Histórico).");
  }

  // 4. Sincroniza com o Perfil (Dados Pessoais + Clínicos)
  const perfilPayload = {
    sexo: val('sexo'),
    CPF: val('cpf'),
    data_nascimento: val('dataNascimento'),
    telefone: val('telefone'),
    peso: Number(val('peso')) || null,
    altura: Number(val('altura')) || null,
    alergias: val('alergias'),
    medicamentos_em_uso: val('medicamentosEmUso'),
    doencas_preexistentes: val('doencasPreexistentes'),
    historico_familiar: val('historicoFamiliar'),
    pressao_arterial: val('pressaoArterial'),
    frequencia_cardiaca: Number(val('frequenciaCardiaca')) || null,
    temperatura: Number(val('temperatura')) || null,
    saturacao_oxigenio: Number(val('saturacaoOxigenio')) || null,
    observacoes: val('observacoesAdicionais')
  };

  console.log("🔄 [Pré-Prontuário] Sincronizando dados com o perfil...", perfilPayload);
  const profileRes = await profileService.saveProfile(perfilPayload);

  if (profileRes.error) {
    console.error("❌ [Pré-Prontuário] Erro ao sincronizar perfil:", profileRes.error);
  } else {
    console.log("✅ [Pré-Prontuário] Perfil sincronizado com sucesso!");
  }

  const canal = document.querySelector('input[name="canalEnvio"]:checked')?.value;
  let msgEnvio = 'PDF baixado e consulta salva no histórico!';
  if (canal === 'email') msgEnvio = 'Consulta salva e PDF gerado (Envio por e-mail simulado).';
  else if (canal === 'whatsapp') msgEnvio = 'Consulta salva e PDF gerado (Envio por WhatsApp simulado).';

  await gerarArquivoPDFPuro(btnDownload, msgEnvio);

  // Limpa o rascunho salvo localmente
  limparRascunho();

  btnDownload.disabled = false;
  btnDownload.innerHTML = originalText;

  // Reseta formulario após gerar PDF
  form.reset();
  irParaStep(1);
  document.querySelectorAll('.pp-step').forEach((s) => {
    s.classList.remove('active', 'done');
    if (s.id === 'progress-step-1') s.classList.add('active');
  });
  document.querySelectorAll('.pp-step-line').forEach((l) => l.classList.remove('done'));
});

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimeout;
function mostrarToast(tipo, icone, mensagem) {
  clearTimeout(toastTimeout);
  toast.className = `pp-toast ${tipo}`;
  toastIcon.innerHTML = icone;
  toastMsg.innerHTML = mensagem;
  toast.classList.add('show');
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 6000);
}
