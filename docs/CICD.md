# CI/CD do Papa Pizza (Aula 08 - Docker II)

## 1. Docker Hub: gerar o token
Perfil > Account Settings > Personal Access Token > Generate (permissão **Read/Write**). Copie o token.

## 2. GitHub: configurar credenciais
Repositório > Settings > Secrets and variables > Actions:
- **Secrets** > New repository secret: `DOCKER_PASS` = o token copiado.
- **Variables** > New repository variable: `DOCKER_USER` = seu usuário do Docker Hub.
  (O workflow também aceita `DOCKER_USER` como Secret.)

## 3. Registrar a imagem manualmente (opcional, para treinar)
```
docker login
docker build -t papa-pizza .
docker tag papa-pizza SEU_USUARIO/papa-pizza:v1
docker push SEU_USUARIO/papa-pizza:v1
```

## 4. Pipeline (.github/workflows/build.yml)
`quality` -> `build` (build + push) -> `test` (testes dentro do container).
Dispara a cada push em `main`/`master` ou manualmente em Actions > Run workflow.

## 5. Rodar os testes localmente
```
docker build -t papa-pizza .
docker run --rm papa-pizza python -m unittest discover -s tests -v
```
