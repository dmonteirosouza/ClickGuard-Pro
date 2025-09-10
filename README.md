# ClickGuard Pro 🛡️

**Proteção e Produtividade Digital**

Uma extensão para Chrome que monitora sua atividade de cliques durante o horário de trabalho, ajudando você a manter-se produtivo e demonstrar engajamento profissional.

## 🎯 Características

- ⏰ **Configuração de Horários**: Defina entrada, saída para almoço, volta do almoço e saída
- 📊 **Monitoramento Inteligente**: Conta cliques, teclas e atividade durante horário de trabalho
- 📈 **Estatísticas Detalhadas**: Visualize cliques diários, semanais e média por hora
- 🔒 **Privacidade Total**: Todos os dados ficam no seu navegador
- 🎨 **Design Elegante**: Interface moderna com cores corporativas
- 🚫 **Anti-Detecção**: Funciona discretamente sem interferir na navegação

## 🚀 Instalação

### Método 1: Instalação Manual (Recomendado)

1. **Baixe os arquivos**: Salve todos os arquivos da extensão em uma pasta local
2. **Abra o Chrome**: Vá para `chrome://extensions/`
3. **Ative o Modo Desenvolvedor**: Toggle no canto superior direito
4. **Carregue a extensão**: Clique em "Carregar sem compactação" e selecione a pasta
5. **Configure**: Clique no ícone da extensão e defina seus horários

### Método 2: Arquivo ZIP

1. Baixe todos os arquivos e compacte em um ZIP
2. Extraia em uma pasta local
3. Siga os passos 2-5 do Método 1

## 📁 Estrutura de Arquivos

```
clickguard-pro/
├── manifest.json          # Configuração da extensão
├── popup.html             # Interface principal
├── popup.js               # Lógica da interface
├── background.js          # Gerenciamento em segundo plano
├── content.js             # Detecção de cliques nas páginas
├── icons/                 # Ícones da extensão
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # Este arquivo
```

## 🔧 Como Usar

1. **Configurar Horários**:
   - Clique no ícone da extensão
   - Defina entrada, saída almoço, volta almoço e saída
   - Clique em "Salvar Horários"

2. **Monitoramento Automático**:
   - A extensão detecta automaticamente quando você está em horário de trabalho
   - Status verde = monitorando | Status cinza = fora do horário

3. **Visualizar Estatísticas**:
   - Cliques do dia atual
   - Total da semana
   - Média de cliques por hora
   - Horas trabalhadas hoje

## 📊 O que é Monitorado

- **Cliques do mouse** em qualquer elemento da página
- **Teclas digitadas** (letras, números, Enter, espaço, etc.)
- **Scroll da página** (limitado para evitar spam)
- **Movimento do mouse** (muito limitado, apenas para detectar presença)

## 🔒 Privacidade e Segurança

- ✅ **Dados locais**: Tudo fica armazenado no seu Chrome
- ✅ **Não envia dados**: Nenhuma informação sai do seu computador
- ✅ **Sem tracking**: Não rastreia sites visitados
- ✅ **Código aberto**: Você pode verificar todo o código
- ✅ **Sem servidor**: Funciona 100% offline

## ⚙️ Configurações Avançadas

### Personalizar Horários
- Suporte a qualquer horário de trabalho
- Flexibilidade para diferentes turnos
- Pausa para almoço configurável

### Reset de Dados
- Botão para limpar todas as estatísticas
- Limpeza automática de dados antigos (30+ dias)

## 🎨 Personalização

A extensão usa o esquema de cores laranja (#FF6B00) inspirado em instituições financeiras, mantendo um visual profissional e moderno.

## 🔧 Solução de Problemas

### A extensão não está contando cliques
1. Verifique se está em horário de trabalho
2. Confirme se os horários estão salvos
3. Recarregue a página atual

### Ícone não aparece
1. Verifique se a extensão está ativada em `chrome://extensions/`
2. Fixe a extensão na barra de ferramentas

### Dados não salvam
1. Verifique se o Chrome tem permissão para armazenar dados
2. Tente resetar e configurar novamente

## 📱 Compatibilidade

- ✅ Chrome 88+
- ✅ Chromium
- ✅ Edge (baseado em Chromium)
- ✅ Brave
- ✅ Opera

## 🆙 Atualizações Futuras

- 📊 Relatórios semanais/mensais
- 📧 Exportação de dados
- 🎯 Metas de produtividade
- 📱 Sincronização entre dispositivos
- 🔔 Notificações inteligentes

## 🤝 Contribuições

Este projeto foi desenvolvido para demonstrar engajamento profissional de forma ética e transparente. Contribuições são bem-vindas!

## 📄 Licença

Projeto de uso pessoal e profissional. Use com responsabilidade e de acordo com as políticas da sua empresa.

---

**ClickGuard Pro** - Mantendo você produtivo e protegido! 🛡️