import{a as u,R as n}from"./authService-FkTjPsGX.js";function b(){if(document.getElementById("telegram-fab"))return;const i=document.createElement("style");i.textContent=`
        .telegram-fab {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            background-color: #0088cc;
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 34px;
            box-shadow: 0 4px 12px rgba(0, 136, 204, 0.4);
            cursor: pointer;
            z-index: 9999;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            text-decoration: none;
        }

        .telegram-fab:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(0, 136, 204, 0.6);
            color: #ffffff;
        }

        .telegram-fab::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            background-color: #0088cc;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            z-index: -1;
            animation: telegram-pulse 2s infinite;
        }

        @keyframes telegram-pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
            100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
    `,document.head.appendChild(i);const e=document.createElement("a");e.id="8529907810",e.href="https://t.me/EncontreSaudeBot",e.target="_blank",e.className="telegram-fab",e.title="Fale com nossa Automação",e.innerHTML='<i class="fa-brands fa-telegram" style="margin-right: 2px;"></i>',document.body.appendChild(e)}async function E(){const{session:i}=await u.getUserSession();if(!document.getElementById("header"))return;const t=document.createElement("nav");t.className="sidebar";const d=document.createElement("div");d.className="sidebar-logo";const m=document.createElement("img");m.src="/assets/logoTipo.png",m.alt="Encontre Saúde Logo",d.appendChild(m),t.appendChild(d);const f=document.createElement("div");f.className="sidebar-nav";const p=[{text:"Home",icon:"fa-house",href:n.home},{text:"Primeiros Socorros",icon:"fa-kit-medical",href:n.primeirosSocorros},{text:"Ações Preventivas",icon:"fa-shield-heart",href:n.prevensao},{text:"Farmácias",icon:"fa-prescription-bottle-medical",href:n.farmacia}];i?p.push({text:"Meu Perfil",icon:"fa-user",href:n.perfil}):p.push({text:"Login / Cadastro",icon:"fa-arrow-right-to-bracket",href:n.login}),p.forEach(({text:a,icon:c,href:o})=>{const l=document.createElement("a");l.href=o,l.className="nav-item",l.innerHTML=`
            <i class="fas ${c} nav-icon"></i>
            <span class="nav-text">${a}</span>
        `,f.appendChild(l)}),t.appendChild(f),u.onAuthStateChange((a,c)=>{a==="SIGNED_OUT"&&(window.location.href=n.home)});const h=document.createElement("div");h.className="sidebar-footer",[{icon:"fa-brands fa-whatsapp",href:"https://wa.me/46991213122"},{icon:"fa-solid fa-phone",href:"tel:+5546991213122"},{icon:"fa-solid fa-envelope",href:"mailto:seuemail@gabrielwag971@gmail.com"}].forEach(({icon:a,href:c})=>{const o=document.createElement("a");o.href=c,o.target="_blank",o.className="contact-icon",o.innerHTML=`<i class="${a}"></i>`,h.appendChild(o)}),t.appendChild(h);const s=document.createElement("button");s.className="mobile-menu-toggle",s.innerHTML='<i class="fas fa-bars"></i>',document.body.appendChild(s);const r=document.createElement("div");r.className="sidebar-overlay",document.body.appendChild(r);function g(){t.classList.toggle("active"),r.classList.toggle("active"),s.innerHTML=t.classList.contains("active")?'<i class="fas fa-times"></i>':'<i class="fas fa-bars"></i>'}s.addEventListener("click",g),r.addEventListener("click",g),t.querySelectorAll(".nav-item").forEach(a=>{a.addEventListener("click",()=>{window.innerWidth<=768&&g()})}),document.body.prepend(t),document.body.classList.add("with-sidebar"),b()}export{E as c};
