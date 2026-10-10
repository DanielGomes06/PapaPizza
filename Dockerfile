# 1. Qual imagem base vamos usar? (Python oficial, versão 3.12)
FROM python:3.12-slim

# 2. Em qual pasta a aplicação vai morar dentro do container?
WORKDIR /app

# 3. Copia todo o código do site (HTML, CSS, JS, assets)
#    Não há requirements.txt: é um site estático, sem dependências Python.
COPY . .

# 4. Qual porta a aplicação usa?
EXPOSE 5000

# 5. Comando para ligar a aplicação
#    Usa o servidor HTTP embutido do Python para servir os arquivos estáticos.
CMD ["python", "-m", "http.server", "5000"]
