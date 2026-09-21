
export function createFooter() {
    // Check if footer already exists to avoid duplicates
    if (document.querySelector("footer")) return;

    const footer = document.createElement("footer");
    footer.className = "main-footer";

    // Divider line (simulated with CSS border-top on footer)

    const container = document.createElement("div");
    container.className = "footer-container";

    // Left Section: Developers
    const leftSection = document.createElement("div");
    leftSection.className = "footer-left";

    const devTitle = document.createElement("h3");
    devTitle.textContent = "Desenvolvedores";
    leftSection.appendChild(devTitle);

    const devList = document.createElement("ul");
    const developers = [
        "Gabriel Wagner",
        "Lucas André Miguel",
        "Lucas Juraski Rodrigues",
        "Luiz Fernando Dantas Nuernberg",
        "Matheus Pacifico Rafagnin",
        "Rodrigo Baggio",
        "Thiago Stopassola Metzler"
    ];

    developers.forEach(dev => {
        const li = document.createElement("li");
        li.textContent = dev.toUpperCase();
        devList.appendChild(li);
    });

    // Professor separate from list or part of it? User said "o professor da turma é o BRYAM ASSOLINI, coloque isso na esquerda"
    const professor = document.createElement("p");
    professor.className = "professor-name";
    professor.innerHTML = "<strong>Professor:</strong> BRYAM ASSOLINI";

    leftSection.appendChild(devList);
    leftSection.appendChild(professor);


    // Right Section: Project Info
    const rightSection = document.createElement("div");
    rightSection.className = "footer-right";

    const projectTitle = document.createElement("h3");
    projectTitle.textContent = "Projeto Integrador  ";
    const projectDesc = document.createElement("p");
    projectDesc.textContent = "Site desenvolvido em equipe pela turma 202500002 como parte do projeto integrador com o objetivo de auxiliar pessoas novas em beltrão ou com duvidas sobre situações de saude.";

    rightSection.appendChild(projectTitle);
    rightSection.appendChild(projectDesc);

    // Append sections
    container.appendChild(leftSection);
    container.appendChild(rightSection);
    footer.appendChild(container);

    // Append to body (or specific container if needed, but body is usually safe for fixed/bottom footers)
    // The user said "na base da tela". 
    // Usually standard flow is after main.
    const main = document.querySelector("main");
    if (main) {
        main.after(footer);
    } else {
        document.body.appendChild(footer);
    }
}
