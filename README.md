# Finanças Casa RL

App de finanças do casal (PWA): contas do mês por vencimento, faturas dos cartões, gastos fixos, metas, regra 50/30/20 e planejamento do cartão de crédito.

- **App:** https://luispiritiba-oss.github.io/financas-casa-rl/
- **Dados:** ficam na pasta do Google Drive do casal, por um servidor do Google Apps Script (`servidor/Code.gs`). **Este repositório tem só o código** — nenhuma fatura, renda, telefone ou foto.

## Como colocar no ar (uma vez)

### 1. Servidor no Google Drive (Apps Script)
1. Acesse https://script.google.com com a conta Google dona da pasta do Drive e clique em **Novo projeto**.
2. Apague o conteúdo e cole o arquivo `servidor/Code.gs` deste repositório. Salve com o nome **Finanças Casa RL – servidor**.
3. No topo, escolha a função **configurar** e clique em **Executar**. Autorize o acesso ao Drive.
4. Abra **Execução › Registros**: aparecem a *Chave do Luis* e a *Chave da Roanna*. Guarde as duas.
5. Clique em **Implantar › Nova implantação › Tipo: App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
6. Copie a **URL do app da Web** (termina em `/exec`). Esse é o *endereço do servidor*.

> "Qualquer pessoa" só significa que o endereço responde pela internet: sem uma das duas chaves, o servidor recusa tudo.

### 2. Primeiro acesso (Luis)
1. No celular, abra o app e cole o **endereço do servidor** e a **chave do Luis**.
2. Na primeira vez, o app pede o arquivo **casa-rl-dados.json** (enviado no chat): ele leva as faturas de 2026, fixos, rendas, metas, classificações e a foto para o Drive.

### 3. Celular da Roanna
Mande para ela este link (troque os dois valores):

```
https://luispiritiba-oss.github.io/financas-casa-rl/#s=ENDERECO_DO_SERVIDOR&k=CHAVE_DA_ROANNA
```

Ela abre o link uma vez e o app já entra conectado. A Roanna lança gastos, envia faturas, classifica e preenche, mas **não** consegue importar a base nem mudar o app: o código só muda por aqui, no GitHub.

### 4. Instalar na tela inicial
- **iPhone (Safari):** Compartilhar › *Adicionar à Tela de Início*.
- **Android (Chrome):** menu ⋮ › *Instalar app* / *Adicionar à tela inicial*.

## Arquivos no Drive
- `casa-rl-base.json` — faturas importadas, cartões, regras de categoria e foto.
- `casa-rl-estado.json` — rendas, fixos, metas, lançamentos, faturas enviadas pelo app e classificações.
- `backup-AAAA-MM-DD.json` — cópia automática do dia.

## Estrutura
- `index.html` — tela de conexão e carregamento.
- `app.js` — o aplicativo.
- `styles.css`, `manifest.webmanifest`, `sw.js`, `icons/` — visual e instalação no celular.
- `servidor/Code.gs` — servidor do Google Apps Script.
