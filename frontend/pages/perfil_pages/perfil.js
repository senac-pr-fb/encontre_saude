import { createSidebar } from "../../shared/sidebar.js";
import { createFooter } from "../../shared/footer.js";
import { ROUTES } from "../../config/routes/routes.js";
import { authService } from "../../Services/authService.js";
import { profileService } from "../../Services/profileService.js";
import { chatService } from "../../Services/chatService.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Auth Guard: Validar sessão com Supabase
  const { session, user } = await authService.getUserSession();

  if (!session) {
    window.location.href = ROUTES.login;
    return;
  }

  // Esconde o "flicker" inicial
  const container = document.querySelector(".perfil-container");
  if (container) container.style.opacity = "1";

  // 2. Atualizar informações básicas no cabeçalho
  const viewNomeTitulo = document.getElementById("viewNomeTitulo");
  const displayEmail = document.getElementById("displayEmail");

  if (user) {
    const nomeUsuario = user.user_metadata?.full_name || user.user_metadata?.name || "Paciente";
    if (viewNomeTitulo) viewNomeTitulo.textContent = nomeUsuario;
    if (displayEmail) displayEmail.textContent = user.email;
  }

  // 3. Inicializar componentes comuns
  createSidebar();
  createFooter();

  // =============================================
  // ESTADO E REFERÊNCIAS
  // =============================================
  const viewMode = document.getElementById("viewMode");
  const perfilForm = document.getElementById("perfilForm");
  const btnEditSaude = document.getElementById("btnEditSaude");
  const btnCancelEdit = document.getElementById("btnCancelEdit");

  let dadosSaude = null;
  let sessoesHistoricoCache = [];

  // =============================================
  // HELPERS DE FORMATAÇÃO
  // =============================================
  const formatarValor = (val, sufixo = "") => {
    if (val === null || val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) {
      return "Não Informado";
    }
    return `${val}${sufixo}`;
  };

  const formatarBooleano = (val) => {
    if (val === true || val === "true") return "Sim";
    if (val === false || val === "false") return "Não";
    return "Não Informado";
  };

  const extrairSintomas = (sintomasData) => {
    if (!sintomasData) return [];

    // Se vier do join do Supabase, virá como um array
    const sintomasObj = Array.isArray(sintomasData) ? sintomasData[0] : sintomasData;
    if (!sintomasObj) return [];

    const nomes = {
      febre: "Febre",
      dor_de_cabeca: "Dor de Cabeça",
      tosse: "Tosse",
      falta_de_ar: "Falta de Ar",
      dor_no_peito: "Dor no Peito",
      nausea_vomito: "Náusea/Vômito",
      diarreia: "Diarreia",
      dor_abdominal: "Dor Abdominal",
      dor_nas_costas: "Dor nas Costas",
      tontura: "Tontura",
      fraqueza: "Fraqueza/Cansaço",
      coriza: "Coriza"
    };
    return Object.keys(nomes).filter(key => sintomasObj[key] === true).map(key => nomes[key]);
  };

  // =============================================
  // LÓGICA DE DADOS DO PERFIL
  // =============================================
  const carregarDadosIniciais = async () => {
    console.log("🔄 [Perfil] Carregando dados iniciais...");
    const { profile, error } = await profileService.getProfile();

    if (error) {
      console.error("❌ [Perfil] Erro ao carregar perfil:", error);
    } else {
      console.log("✅ [Perfil] Dados carregados com sucesso:", profile);
    }

    if (!error && profile) {
      dadosSaude = profile;
      atualizarModoVisualizacao();
    }
  };

  const atualizarModoVisualizacao = () => {
    if (!dadosSaude) return;

    const mapeamento = {
      "view-idade": formatarValor(dadosSaude.idade, " anos"),
      "view-peso": formatarValor(dadosSaude.peso, " kg"),
      "view-altura": formatarValor(dadosSaude.altura, " m"),
      "view-sexo": formatarValor(dadosSaude.sexo),
      "view-CPF": formatarValor(dadosSaude.CPF),
      "view-data_nascimento": dadosSaude.data_nascimento ? new Date(dadosSaude.data_nascimento).toLocaleDateString("pt-BR") : "Não Informado",
      "view-fuma": formatarBooleano(dadosSaude.fuma),
      "view-bebe": formatarBooleano(dadosSaude.bebe),
      "view-alergia": formatarBooleano(dadosSaude.alergia_medicamento) !== "Não Informado" ? dadosSaude.alergia_medicamento : "Não Informado",
      "view-deficiencia": formatarValor(dadosSaude.possui_deficiencia),
    };

    // Mapeamento do contato médico (JSONB)
    const contato = dadosSaude.contato_medico_particular || {};
    mapeamento["view-contato-nome"] = formatarValor(contato.nome);
    mapeamento["view-contato-email"] = formatarValor(contato.email);
    mapeamento["view-contato-telefone"] = formatarValor(contato.telefone);

    // Correção para exibir "Sim/Não" se for booleano, ou o texto se for preenchido
    if (typeof dadosSaude.alergia_medicamento === 'boolean') {
      mapeamento["view-alergia"] = formatarBooleano(dadosSaude.alergia_medicamento);
    }

    for (const [id, valor] of Object.entries(mapeamento)) {
      const el = document.getElementById(id);
      if (el) el.textContent = valor;
    }
  };

  const preencherFormulario = () => {
    if (!dadosSaude) return;

    const campos = [
      "idade", "peso", "altura", "sexo", "CPF", "data_nascimento",
      "alergia_medicamento", "possui_deficiencia"
    ];

    campos.forEach(id => {
      const el = document.getElementById(id);
      if (el && dadosSaude[id] !== undefined && dadosSaude[id] !== null) {
        el.value = dadosSaude[id];
      }
    });

    // Preencher Contato Médico (JSONB)
    const contato = dadosSaude.contato_medico_particular || {};
    if (document.getElementById("contato_medico_nome")) document.getElementById("contato_medico_nome").value = contato.nome || "";
    if (document.getElementById("contato_medico_email")) document.getElementById("contato_medico_email").value = contato.email || "";
    if (document.getElementById("contato_medico_telefone")) document.getElementById("contato_medico_telefone").value = contato.telefone || "";

    // Radios (Fuma/Bebe)
    ["fuma", "bebe"].forEach(name => {
      const val = dadosSaude[name]?.toString();
      if (val) {
        const radio = document.querySelector(`input[name="${name}"][value="${val}"]`);
        if (radio) radio.checked = true;
      }
    });
  };

  // =============================================
  // HISTÓRICO DE CONSULTAS IA
  // =============================================
  const renderizarHistoricoPerfil = async () => {
    const lista = document.getElementById("perfil-historico-lista");
    if (!lista) return;

    const { history, error } = await chatService.getUserHistory();
    lista.innerHTML = "";
    sessoesHistoricoCache = history || [];

    if (error || sessoesHistoricoCache.length === 0) {
      lista.innerHTML = `
                <div class="perfil-historico-vazio">
                    <i class="fas fa-comment-medical"></i>
                    <p>Nenhuma consulta registrada.</p>
                    <small>Suas conversas com a IA de sintomas aparecerão aqui.</small>
                </div>
            `;
      return;
    }

    sessoesHistoricoCache.forEach((sessao, index) => {
      const item = document.createElement("div");
      item.className = "perfil-historico-item";
      const dataFormatada = new Date(sessao.created_at).toLocaleString("pt-BR");
      
      const listaSintomas = extrairSintomas(sessao.sintomas_atendimento);
      const sintomasTexto = listaSintomas.length > 0 ? listaSintomas.join(", ") : "Nenhum registrado";

      item.innerHTML = `
                <div class="perfil-historico-item__data">
                    <i class="fas fa-calendar-alt"></i> ${dataFormatada}
                </div>
                <div class="perfil-historico-item__row">
                    <span class="perfil-historico-badge perfil-historico-badge--user">Você</span>
                    <div class="perfil-historico-content">
                        <p>${sessao.descricao_usuario || "Consulta de sintomas"}</p>
                        ${listaSintomas.length > 0
          ? `<div class="perfil-historico-item__sintomas">${listaSintomas.map(s => `<span>${s}</span>`).join("")}</div>`
          : ""}
                    </div>
                </div>
                <div class="perfil-historico-item__row">
                    <span class="perfil-historico-badge perfil-historico-badge--sintomas">Sintomas</span>
                    <p><strong>Sintomas:</strong> ${sintomasTexto}</p>
                </div>
                <div class="perfil-historico-item__row">
                    <span class="perfil-historico-badge perfil-historico-badge--ai">IA / Notas</span>
                    <p>${sessao.resposta_ia}</p>
                </div>
                <div class="perfil-historico-actions">
                    <button class="btn-detalhes-ia" data-index="${index}">
                        <i class="fas fa-expand-alt"></i> Ver detalhes
                    </button>
                    <button class="btn-gerar-pdf-fluxo" data-index="${index}">
                        <i class="fas fa-file-pdf"></i> Gerar PDF
                    </button>
                </div>
            `;
      lista.appendChild(item);
    });
  };

  // =============================================
  // MODAL DE DETALHES
  // =============================================
  const modalHistorico = document.getElementById("modal-historico");
  const closeModalHistorico = document.getElementById("closeModalHistorico");

  const abrirModalHistorico = (dados) => {
    if (!modalHistorico) return;
    document.getElementById("modal-data").textContent = new Date(dados.created_at).toLocaleString("pt-BR");
    document.getElementById("modal-usuario").textContent = dados.descricao_usuario;
    document.getElementById("modal-ia").textContent = dados.resposta_ia;

    // Sintomas no Modal
    const listaSintomas = extrairSintomas(dados.sintomas_atendimento);
    const containerSintomas = document.getElementById("modal-sintomas");
    const groupSintomas = document.getElementById("modal-sintomas-group");

    if (listaSintomas.length > 0) {
      containerSintomas.innerHTML = listaSintomas.map(s => `<span class="sintoma-badge">${s}</span>`).join("");
      groupSintomas.style.display = "block";
    } else {
      groupSintomas.style.display = "none";
    }
    modalHistorico.classList.add("show");
    document.body.style.overflow = "hidden";
  };

  const fecharModalHistorico = () => {
    modalHistorico.classList.remove("show");
    document.body.style.overflow = "";
  };

  closeModalHistorico?.addEventListener("click", fecharModalHistorico);
  window.addEventListener("click", (e) => {
    if (e.target === modalHistorico) fecharModalHistorico();
  });

  document.getElementById("perfil-historico-lista")?.addEventListener("click", (e) => {
    const btnDet = e.target.closest(".btn-detalhes-ia");
    const btnPdf = e.target.closest(".btn-gerar-pdf-fluxo");

    if (btnDet) {
      const idx = btnDet.getAttribute("data-index");
      if (sessoesHistoricoCache[idx]) abrirModalHistorico(sessoesHistoricoCache[idx]);
    }

    if (btnPdf) {
      const idx = btnPdf.getAttribute("data-index");
      if (sessoesHistoricoCache[idx]) prepararEdicaoEPdf(sessoesHistoricoCache[idx]);
    }
  });

  const prepararEdicaoEPdf = (sessao) => {
    let clinicos = {};
    try { clinicos = JSON.parse(sessao.dados_clinicos || "{}"); } catch (e) { }

    const draftData = {
      data: {
        nome: document.getElementById("view-nome")?.textContent || "",
        dataNascimento: dadosSaude?.data_nascimento || "",
        cpf: dadosSaude?.CPF || "",
        sexo: dadosSaude?.sexo || "",
        telefone: dadosSaude?.telefone || "",
        queixaPrincipal: sessao.descricao_usuario || "",
        sintomas: extrairSintomas(sessao.sintomas_atendimento),
        alergias: clinicos.alergias || "",
        medicamentosEmUso: clinicos.medicamentos || "",
        doencasPreexistentes: clinicos.doencas || "",
        historicoFamiliar: clinicos.historico_familiar || "",
        pressaoArterial: clinicos.pressao || "",
        frequenciaCardiaca: clinicos.freq_cardiaca || "",
        temperatura: clinicos.temperatura || "",
        saturacaoOxigenio: clinicos.saturacao || "",
        peso: clinicos.peso || "",
        altura: clinicos.altura || "",
        observacoesAdicionais: clinicos.observacoes || ""
      },
      isFromHistory: true, // Flag para evitar duplicidade ao gerar PDF
      currentStep: 4, // Leva direto para a tela de resumo/envio
      timestamp: Date.now()
    };

    localStorage.setItem('rascunhoPreProntuario', JSON.stringify(draftData));
    window.location.href = "../pre_prontuario_pages/pre_prontuario.html";
  };

  // =============================================
  // EVENTOS DE NAVEGAÇÃO E MODOS
  // =============================================
  btnEditSaude?.addEventListener("click", () => {
    preencherFormulario();
    viewMode.style.display = "none";
    perfilForm.style.display = "block";
  });

  btnCancelEdit?.addEventListener("click", () => {
    perfilForm.style.display = "none";
    viewMode.style.display = "block";
  });

  const btnVerHistorico = document.getElementById("btn-ver-historico");
  btnVerHistorico?.addEventListener("click", () => {
    const listaHistorico = document.getElementById("perfil-historico-lista");
    const estaOculto = listaHistorico.classList.contains("perfil-historico-lista--oculto");

    if (estaOculto) {
      listaHistorico.classList.remove("perfil-historico-lista--oculto");
      btnVerHistorico.querySelector("span").textContent = "Ocultar histórico";
      btnVerHistorico.querySelector("i").className = "fas fa-chevron-up";
    } else {
      listaHistorico.classList.add("perfil-historico-lista--oculto");
      btnVerHistorico.querySelector("span").textContent = "Ver mais";
      btnVerHistorico.querySelector("i").className = "fas fa-chevron-down";
    }
  });

  // =============================================
  // LOGOUT
  // =============================================
  const handleLogout = async () => {
    await authService.signOut();
    window.location.href = ROUTES.home;
  };
  document.getElementById("btnLogout")?.addEventListener("click", handleLogout);
  document.getElementById("btnLogoutForm")?.addEventListener("click", handleLogout);

  // =============================================
  // SUBMIT FORMULÁRIO
  // =============================================
  perfilForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnSave = perfilForm.querySelector('button[type="submit"]');
    const originalText = btnSave.textContent;
    btnSave.disabled = true;
    btnSave.textContent = "Salvando...";

    const getFieldVal = (id, type) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const val = el.value.trim();
      if (val === "") return null;
      return type === "number" ? Number(val) : val;
    };

    const payload = {
      sexo: getFieldVal("sexo", "string"),
      idade: getFieldVal("idade", "number"),
      peso: getFieldVal("peso", "number"),
      altura: getFieldVal("altura", "number"),
      CPF: getFieldVal("CPF", "string"),
      data_nascimento: getFieldVal("data_nascimento", "string"),
      fuma: document.querySelector('input[name="fuma"]:checked')?.value === "true",
      bebe: document.querySelector('input[name="bebe"]:checked')?.value === "true",
      alergia_medicamento: getFieldVal("alergia_medicamento", "string"),
      possui_deficiencia: getFieldVal("possui_deficiencia", "string"),
      contato_medico_particular: {
        nome: getFieldVal("contato_medico_nome", "string"),
        email: getFieldVal("contato_medico_email", "string"),
        telefone: getFieldVal("contato_medico_telefone", "string")
      },
    };

    console.log("📤 [Perfil] Enviando payload para o serviço:", payload);

    const { profile, error } = await profileService.saveProfile(payload);

    btnSave.disabled = false;
    btnSave.textContent = originalText;

    if (error) {
      console.error("❌ [Perfil] Erro ao salvar perfil:", error);
      alert("Erro ao salvar: " + error.message);
    } else {
      console.log("✅ [Perfil] Perfil salvo com sucesso!", profile);
      dadosSaude = profile;
      perfilForm.style.display = "none";
      viewMode.style.display = "block";
      atualizarModoVisualizacao();
    }
  });

  // =============================================
  // MÁSCARA DE CPF
  // =============================================
  document.getElementById('CPF')?.addEventListener('input', function (e) {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{3})/, '$1.$2');
    e.target.value = v;
  });

  // =============================================
  // CARGA INICIAL
  // =============================================
  carregarDadosIniciais();
  renderizarHistoricoPerfil();
});
