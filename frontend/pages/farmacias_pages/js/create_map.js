import { pharmacyService } from "../../../Services/pharmacyService.js";

export async function createMap() {

    const { data: farmacias, error } = await pharmacyService.getPharmacies();

    if (error) {
        console.error("Erro ao carregar farmácias do banco:", error);
        // Fallback para lista vazia ou tratar erro na UI
    }

    const map = L.map('map').setView([-26.0815, -53.0556], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    let markers = [];

    function renderMarkers(lista) {
        markers.forEach(m => map.removeLayer(m));
        markers = [];

        lista.forEach(farmacia => {
            const marker = L.marker([farmacia.lat, farmacia.lng])
                .addTo(map)
                .bindPopup(`<b>${farmacia.nome}</b><br>${farmacia.endereco}`);

            // Evento ao clicar no marcador
            marker.on('click', () => {
                // Abrir sidebar se estiver fechada
                const sideebar = document.getElementById("sidebar"); // Assegurando a referência
                if (sideebar && !sideebar.classList.contains("active")) {
                    sideebar.classList.add("active");
                }

                // Destacar o card correspondente
                const cardId = "card-" + farmacia.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                const card = document.getElementById(cardId);

                if (card) {
                    // Remove destaque anterior
                    document.querySelectorAll('.card.active').forEach(c => c.classList.remove('active'));
                    // Adiciona destaque no card clicado
                    card.classList.add('active');

                    // Scroll para o card na lista
                    card.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            });

            markers.push(marker);
        });
    }

    function renderFarmaciasList(lista) {
        const container = document.getElementById("farmacias-list");
        if (!container) return;
        container.innerHTML = "";
        lista.forEach(f => {
            const card = document.createElement("div");
            card.className = "card";
            // id baseado no nome da farmácia, removendo espaços e caracteres especiais simples
            card.id = "card-" + f.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

            card.innerHTML = `
            <h3>${f.nome}</h3>
            <p><strong>Endereço:</strong> ${f.endereco}</p>
            <p><strong>Telefone:</strong> ${f.telefone}</p>
            ${f.site ? `<p><a href="${f.site}" target="_blank">🌐 Site</a></p>` : ""}
            ${f.instagram ? `<p><a href="${f.instagram}" target="_blank">📸 Instagram</a></p>` : ""}
            <p><strong>Horário:</strong> ${f.horario}</p>
            <p><strong>Bairro:</strong> ${f.bairro}</p>
        `;
            function abrirRota(lat, lng) {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                window.open(url, '_blank');
            }
            // Botão rota
            const rotaBtn = document.createElement("a");
            rotaBtn.className = "rota-btn";
            rotaBtn.href = "#";
            rotaBtn.textContent = "🧭 Ver Rota";
            rotaBtn.addEventListener("click", (e) => {
                e.preventDefault();
                abrirRota(f.lat, f.lng);
            });

            card.appendChild(rotaBtn);

            card.addEventListener("click", (e) => {
                if (e.target === rotaBtn) return;
                map.setView([f.lat, f.lng], 17);
            });

            container.appendChild(card);
        });
    }

    // Filtragem
    let tipoFiltro = {
        municipal: true, // Default: Ativado
        privada: true,   // Default: Ativado
    };

    function filtrar() {
        // Safe search term
        const searchInput = document.getElementById("search");
        const termo = searchInput ? searchInput.value.toLowerCase().trim() : "";

        const filtrados = farmacias.filter(f => {
            // Safe property access
            const nome = f.nome ? f.nome.toLowerCase() : "";
            const bairro = f.bairro ? f.bairro.toLowerCase() : "";
            const tipo = f.tipo ? f.tipo.toLowerCase().trim() : "";

            // Search in both name and neighborhood
            const matchTexto = nome.includes(termo) || bairro.includes(termo);

            // Strict Filter: Only show if the specific type is enabled
            // If both are false, nothing is shown.
            const matchTipo = tipoFiltro[tipo] === true;

            return matchTexto && matchTipo;
        });

        renderMarkers(filtrados);
        renderFarmaciasList(filtrados);
    }

    const searchInput = document.getElementById("search");
    if (searchInput) searchInput.addEventListener("input", filtrar);

    const btnMunicipal = document.getElementById("btnMunicipal");
    if (btnMunicipal) {
        btnMunicipal.classList.add("active"); // Ativa visualmente por padrão
        btnMunicipal.addEventListener("click", () => {
            tipoFiltro.municipal = !tipoFiltro.municipal;
            btnMunicipal.classList.toggle("active", tipoFiltro.municipal);
            filtrar();
        });
    }

    const btnPrivada = document.getElementById("btnPrivada");
    if (btnPrivada) {
        btnPrivada.classList.add("active"); // Ativa visualmente por padrão
        btnPrivada.addEventListener("click", () => {
            tipoFiltro.privada = !tipoFiltro.privada;
            btnPrivada.classList.toggle("active", tipoFiltro.privada);
            filtrar();
        });
    }

    // Mobile Map Toggle Button (Show/Hide List)
    const mapToggleBtn = document.createElement("button");
    mapToggleBtn.className = "map-toggle-btn";
    mapToggleBtn.innerHTML = '<i class="fas fa-map"></i>';
    document.body.appendChild(mapToggleBtn);

    const overlay = document.getElementById("map-overlay");

    mapToggleBtn.addEventListener("click", () => {
        if (overlay) {
            overlay.classList.toggle("hidden-mobile");

            // Update icon based on state
            if (overlay.classList.contains("hidden-mobile")) {
                mapToggleBtn.innerHTML = '<i class="fas fa-list"></i>'; // Icon to show list
            } else {
                mapToggleBtn.innerHTML = '<i class="fas fa-map"></i>'; // Icon to show map (hide list)
            }
        }
    });

    // Inicialização Controlada
    console.log("Iniciando renderização: Lista -> Mapa");

    // 1. Renderiza filtrado (inicialmente mostra tudo pois filtros estão off)
    filtrar();

    // 2. Aguarda um ciclo de renderização para garantir que o layout estabilizou
    setTimeout(() => {
        // Força o Leaflet a recalcular o tamanho do container (fix para mapa cinza/vazio)
        map.invalidateSize();

        // 3. Renderiza os marcadores (já tratados pelo filtrar, mas reforçando visualmente se necessário)
        console.log("Mapa renderizado com sucesso.");
    }, 300);
}
