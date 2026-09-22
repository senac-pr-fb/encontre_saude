import type { TopicoSocorro } from "@domain/entities/Conteudo";

/**
 * Extraido de frontend/pages/primeiro_socorros_pages/js/init_primeiros_socorros.js,
 * onde o texto vive como HTML dentro do JS. Aqui vira dado tipado: o app renderiza
 * componentes, nao HTML.
 */
export const PRIMEIROS_SOCORROS: TopicoSocorro[] = [
  {
    id: "engasgo",
    titulo: "Engasgo",
    blocos: [
      {
        tipo: "subtitulo",
        texto: "Engasgamento leve"
      },
      {
        tipo: "paragrafo",
        texto: "Os primeiros socorros para engasgamento leve são:"
      },
      {
        tipo: "lista",
        itens: [
          "Pedir para a pessoa tossir 5 vezes com força;",
          "Bater 5 vezes no meio das costas, mantendo a mão aberta e num movimento rápido de baixo para cima.",
          "Durante o engasgamento leve, a pessoa é capaz de tossir, falar ou chorar, pois as vias aéreas estão parcialmente obstruídas, e essas medidas podem ajudar a eliminar o objeto ou o alimento preso nas vias aéreas."
        ]
      },
      {
        tipo: "subtitulo",
        texto: "Engasgamento grave"
      },
      {
        tipo: "paragrafo",
        texto: "Os primeiros socorros para engasgamento grave é fazer a manobra de Heimlich, que consiste em:"
      },
      {
        tipo: "lista",
        itens: [
          "Ficar em pé atrás da vítima, que também deve estar em pé, como mostra o passo 1 da imagem;",
          "Passar os braços em volta do tronco da pessoa;",
          "Fechar a mão que tem mais força, com o polegar para baixo;",
          "Posicionar a mão fechada na região superior do abdômen ou \"boca do estômago\", que fica entre as costelas, como mostra o passo 2 da imagem;",
          "Colocar a outra mão sobre a mão que tem o punho cerrado;",
          "Fazer pressão com as mãos contra o estômago da pessoa, para dentro e para cima, como se fosse desenhar uma vírgula, como mostra o passo 3 da imagem.",
          "Essa manobra pode ser feita quando a técnica para engasgamento leve não teve resultado ou quando as vias aéreas estão completamente obstruídas, que pode ser identificada quando a pessoa não consegue tossir, falar ou chorar."
        ]
      }
    ]
  },
  {
    id: "massagem-cardiaca",
    titulo: "Massagem Cardíaca",
    blocos: [
      {
        tipo: "paragrafo",
        texto: "Deve ser realizada quando há uma dor no peito, causando uma sensação de pressão ou aperto, ou ainda quando há dor em outras partes do corpo, como mandíbula, pescoço, costas e barriga.",
        destaque: true
      },
      {
        tipo: "paragrafo",
        texto: "Como proceder:"
      },
      {
        tipo: "lista",
        itens: [
          "Ajoelhe-se ao lado da pessoa e coloque a palma de uma de suas mãos no centro do peito do paciente.",
          "Coloque a palma da outra mão em cima da palma que está no peito e entrelace os dedos.",
          "Posicione-se de modo que seus ombros fiquem diretamente acima de suas mãos.",
          "Usando seu peso corporal (não apenas seus braços), pressione o peito do indivíduo para baixo. Mantendo as mãos no peito, solte a compressão e permita que ele volte à sua posição original.",
          "Repita essa ação em cerca de 100 a 120 vezes por minuto até que uma ambulância chegue ou pelo tempo que puder."
        ]
      }
    ]
  },
  {
    id: "desmaio",
    titulo: "Desmaio",
    blocos: [
      {
        tipo: "paragrafo",
        texto: "Em caso de desmaio, caso a pessoa esteja respirando, os primeiros socorros são:",
        destaque: true
      },
      {
        tipo: "lista",
        itens: [
          "Deitar a pessoa no chão, de barriga para cima, e colocar as pernas mais altas que o corpo e a cabeça, cerca de 30 a 40 centímetros do chão;",
          "Afrouxar as roupas e abrir os botões para facilitar a respiração;",
          "Ir comunicando com a pessoa, mesmo que ela não responda, referindo que está ali para ajudá-la;",
          "Observar possíveis lesões causadas pela queda e se estiver sangrando, parar a hemorragia.",
          "Depois de recuperar do desmaio, pode ser dado 1 saqueta de açúcar, de 5g, diretamente na boca, por baixo da língua.",
          "Se a pessoa demorar mais de 1 minuto para acordar, é recomendado chamar uma ambulância através do número 192 e verificar novamente se está respirando, iniciando a massagem cardíaca, caso não esteja."
        ]
      }
    ]
  },
  {
    id: "convulsao",
    titulo: "Convulsão",
    blocos: [
      {
        tipo: "paragrafo",
        texto: "Para realizar os primeiros socorros para convulsão, deve-se:",
        destaque: true
      },
      {
        tipo: "lista",
        itens: [
          "Deitar a pessoa no chão de barriga para cima, para evitar uma queda durante a crise convulsiva;",
          "Colocar a pessoa deitada de lado, na posição lateral de segurança, para evitar que possa se engasgar com a própria língua ou com vômito",
          "Colocar algo macio sob a cabeça da pessoa, como uma almofada, travesseiro, toalha enrolada ou casaco;",
          "Dar espaço para a pessoa, afastando objetos que estejam próximos e que possam causar lesões, como mesas, cadeiras ou objetos pontiagudos ou cortantes;",
          "Afrouxar roupas apertadas, se possível, principalmente em volta do pescoço, como camisas ou gravatas;",
          "Anotar o horário em que a convulsão começou;",
          "Verificar a respiração, quando os movimentos bruscos pararem;",
          "Monitorar o nível de consciência e de resposta da pessoa;",
          "Anotar o horário em que a convulsão terminou;",
          "Tranquilizar a pessoa até que ela se recupere.",
          "Se a pessoa não estiver respirando ou não tiver pulso, deve-se iniciar a massagem cardíaca."
        ]
      }
    ]
  },
  {
    id: "intoxicacao",
    titulo: "Intoxicação",
    blocos: [
      {
        tipo: "subtitulo",
        texto: "Primeiros socorros por ingestão"
      },
      {
        tipo: "lista",
        itens: [
          "Os primeiros socorros após ingestão de produtos, remédios, venenos ou drogas são:",
          "Manter a calma e tentar verificar se existem substâncias, frascos ou blister de remédios, drogas ou venenos próximos à vítima;",
          "Ligar imediatamente para o SAMU 192 ou corpo de bombeiros no 193, ou levar a vítima imediatamente para o hospital;",
          "Entrar em contato com o Centro de Informação e Assistência Toxicológica (CIAT), através do número 0800-722-6001, para receber uma orientação dos profissionais enquanto o socorro médico chega;",
          "Colocar a pessoa na posição lateral de segurança, deitada de lado e com a cabeça mais baixa em relação ao corpo;",
          "Não induzir o vômito e não oferecer bebidas ou alimentos;",
          "Enxaguar ou limpar a boca para remover qualquer substância restante."
        ]
      },
      {
        tipo: "subtitulo",
        texto: "Primeiros socorros para intoxicação na pele"
      },
      {
        tipo: "lista",
        itens: [
          "Os primeiros socorros para intoxicação por contato com a pele são:",
          "Lavar o local com água corrente e sabão;",
          "Afastar a pessoa da substância tóxica;",
          "Tirar imediatamente a roupa e os sapatos contaminados;",
          "Ir para o pronto-socorro imediatamente ou ligar para o SAMU no 192 ou corpo de bombeiros no 193;",
          "Não dar remédios para a pessoa tomar;",
          "Não aplicar substâncias no local afetado, como álcool ou vinagre, por exemplo: No entanto, em alguns casos, como intoxicação por ácido sulfúrico, pode-se aplicar solução de bicarbonato de sódio a 5% no local afetado, após lavar a pele."
        ]
      },
      {
        tipo: "subtitulo",
        texto: "Primeiros socorros para intoxicação nos olhos"
      },
      {
        tipo: "lista",
        itens: [
          "Lavar os olhos imediatamente em água corrente por pelo menos 15 minutos;",
          "Não usar uma ducha de alta pressão para lavar o olho;",
          "Não aplicar colírios, pomadas oftálmicas, sabonetes ou qualquer outro produto nos olhos;",
          "Cobrir o olho afetado com uma gaze estéril ou um pano limpo e seco.",
          "Em seguida, deve-se ir imediatamente para o hospital para avaliação com o oftalmologista e realizar o tratamento mais adequado."
        ]
      },
      {
        tipo: "subtitulo",
        texto: "Primeiros socorros por inalação"
      },
      {
        tipo: "lista",
        itens: [
          "Os primeiros socorros para intoxicação por inalação de gases, vapores, fumaça ou monóxido de carbono são:",
          "Proteger-se primeiro antes de acudir a vítima;",
          "Levar a vítima para um local mais arejado longe do gás ou fumaça;",
          "Colocar a vítima na posição lateral de segurança, caso não esteja esteja consciente;",
          "Ligar imediatamente para o SAMU 192 ou corpo de bombeiros 193;",
          "Iniciar a massagem cardíaca, caso a pessoa não esteja respirando, até a chegada da ambulância."
        ]
      }
    ]
  },
  {
    id: "afogamento",
    titulo: "Afogamento",
    blocos: [
      {
        tipo: "paragrafo",
        texto: "Para realizar os primeiros socorros para convulsão, deve-se:",
        destaque: true
      },
      {
        tipo: "lista",
        itens: [
          "Pedir ajuda para outra pessoa que esteja próxima ao local, para que ambas possam seguir com o socorro;",
          "Ligar imediatamente para a ambulância dos bombeiros no 193, caso não seja possível, deve-se ligar para o SAMU no 192;",
          "Fornecer algum material flutuante para a pessoa que está se afogando, como garrafas de plástico vazias, pranchas de surf ou materiais de isopor ou de espumas;",
          "Tentar realizar o socorro sem entrar na água. Caso a pessoa se encontre a menos de 4 metros de distância, é possível estender um galho ou cabo de vassoura, entretanto, se a vítima estiver a mais de 4 metros de distância, pode-se jogar uma boia com uma corda, segurando na extremidade oposta. Quando a vítima está próxima, é importante oferecer sempre o pé ao invés da mão, pois com o nervosismo, a vítima pode puxar o socorrista para dentro da água;",
          "Entrar na água somente se souber nadar;",
          "Caso a pessoa seja retirada da água, é importante verificar a respiração, durante 10 segundos, observando os movimentos do tórax e escutando o ar sair pelo nariz. Se estiver respirando, é importante deixar a pessoa deitada de lado até que os profissionais cheguem no local;",
          "Se a pessoa estiver consciente, sem sintomas, somente com tosse seca ou com a presença de espuma na boca, é recomendado observar a respiração, pedindo a pessoa para deitar de lado, mantendo-a aquecida, relaxada e calma até a chegada dos bombeiros ou SAMU;",
          "Se estiver inconsciente e não estiver respirando, é recomendado iniciar a massagem cardíaca na vítima."
        ]
      }
    ]
  },
  {
    id: "queimadura",
    titulo: "Queimadura",
    blocos: [
      {
        tipo: "paragrafo",
        texto: "O que fazer na queimadura de 1º grau:",
        destaque: true
      },
      {
        tipo: "lista",
        itens: [
          "Colocar a região queimada debaixo de água fria por, pelo menos, 15 minutos;",
          "Manter um pano limpo e umedecido em água fria na região durante as primeiras 24 horas, trocando sempre que a água aquecer;",
          "Não aplicar qualquer produto, como óleo ou manteiga, na queimadura;",
          "Passar uma pomada hidratante ou cicatrizante para queimaduras, como Nebacetin ou Unguento"
        ]
      },
      {
        tipo: "paragrafo",
        texto: "O que fazer na queimadura de 2º grau:",
        destaque: true
      },
      {
        tipo: "lista",
        itens: [
          "Colocar o local afetado debaixo de água corrente fria por, pelo menos, 15 minutos;",
          "Lavar cuidadosamente a queimadura com água fria e sabão de pH neutro, evitando esfregar com muita força;",
          "Cobrir a região com uma gaze molhada ou com bastante vaselina, e prender com uma ligadura, durante as primeiras 48 horas, trocando sempre que necessário;",
          "Não furar as bolhas e não aplicar qualquer produto no local, para evitar o risco de infecção;",
          "Procurar ajuda médica se a bolha for muito grande."
        ]
      },
      {
        tipo: "paragrafo",
        texto: "O que fazer na queimadura de 3º grau",
        destaque: true
      },
      {
        tipo: "lista",
        itens: [
          "Chamar imediatamente uma ambulância, ligando para o 192 ou leve a pessoa rapidamente para o hospital;",
          "Esfriar a região queimada com soro fisiológico, ou na sua falta, água da torneira, por cerca de 10 minutos;",
          "Colocar cuidadosamente uma gaze esterilizada umedecida em soro fisiológico ou um pano limpo sobre a região afetada, até a chegada da ajuda médica. Caso a região queimada seja muito grande, pode-se enrolar um lençol limpo umedecido em soro fisiológico e que não largue pelos;",
          "Não colocar nenhum tipo de produto na região afetada.",
          "Em alguns casos, a queimadura de 3º grau pode ser tão grave que provoca falha em vários órgãos. Nestes casos, caso a vítima desmaie e deixe de respirar deve-se iniciar a massagem cardíaca.",
          "Uma vez que todas as camadas de pele estão afetadas, os nervos, glândulas, músculos e até órgãos internos podem sofrer lesões graves. Neste tipo de queimadura pode não se sentir dor devido à destruição dos nervos, mas é necessária ajuda médica imediata para evitar complicações graves, assim como infecções."
        ]
      }
    ]
  },
  {
    id: "transporte-de-vitimas",
    titulo: "Transporte de vítimas",
    blocos: [
      {
        tipo: "lista",
        itens: [
          "Se a vítima estiver consciente, pergunte se ela sente dor em alguma parte do corpo. Caso sim, verifique se há fratura ou corte na região e aplique os procedimentos padrões.",
          "Caso não haja dor aparente, com o auxílio de uma tábua ou cobertor, improvise uma maca para transportá-la até o posto de saúde mais próximo. Durante o transporte, mantenha sempre a cabeça da vítima elevada e evite movimentos bruscos ao longo do trajeto."
        ]
      }
    ]
  },
  {
    id: "fratura",
    titulo: "Fratura",
    blocos: [
      {
        tipo: "paragrafo",
        texto: "Para realizar os primeiros socorros para ferimentos, deve-se:",
        destaque: true
      },
      {
        tipo: "lista",
        itens: [
          "Manter o membro afetado em repouso, numa posição natural e confortável;",
          "Não pressionar o local da fratura e verificar a cor do membro afetado para verificar se tem circulação sanguínea adequada;",
          "Imobilizar as articulações que ficam acima e abaixo da lesão, com o uso de talas. Não havendo talas disponíveis, é possível improvisar com pedaços de papelão, revistas ou jornais dobrados ou pedaços de madeira, que devem ser acolchoadas com panos limpos e amarrados ao redor da articulação;",
          "Lavar a região com soro fisiológico 0,9%, antes de imobilizar, no caso de fratura exposta;",
          "Cobrir o ferimento, no caso da fratura exposta, de preferência com gaze esterilizada ou um pano limpo. Se houver um sangramento muito intenso, é necessário fazer compressão acima da região fraturada para tentar impedir a saída do sangue. Saiba mais detalhes dos primeiros socorros em caso de fratura exposta;",
          "Nunca tentar endireitar uma fratura ou colocar o osso no lugar;",
          "Não movimentar a vítima, até que o membro esteja seguro e o socorro chegue, a não ser que a pessoa tenha parada cardiorrespiratória. Nesses casos, deve-se movimentar a vítima o menos possível e como um todo, e iniciar a massagem cardíaca. Saiba como fazer a massagem cardíaca corretamente;",
          "Aguardar o auxílio médico. Caso não seja possível, recomenda-se levar a vítima para o pronto-socorro mais próximo."
        ]
      }
    ]
  }
];

/** Dicas rotativas de frontend/pages/primeiro_socorros_pages/js/dicas.js */
export const DICAS_RAPIDAS: string[] = [
  "Manter a calma durante emergências ajuda você e a vítima.",
  "Sempre verifique se o local é seguro antes de prestar socorro.",
  "Use luvas descartáveis para evitar contaminação ao ajudar alguém.",
  "Se a pessoa estiver inconsciente, chame ajuda imediatamente e verifique a respiração.",
  "Em caso de queimadura, lave a área com água fria por pelo menos 10 minutos.",
  "Nunca retire objetos perfurantes do corpo da vítima — isso pode piorar a lesão.",
  "Evite mover uma pessoa com suspeita de fratura na coluna.",
  "Tenha sempre um kit de primeiros socorros em casa e no carro.",
  "Aprender RCP pode salvar vidas — considere fazer um curso básico.",
  "Em caso de envenenamento, não provoque vômito sem orientação médica."
];
