# Engineering workflow

Neste repositório, use o fluxo: PLANNER → DEVELOPER (RED/GREEN/REFACTOR) → REVIEWER → CORREÇÕES → VALIDAÇÃO HUMANA.

## Regras gerais
- Investigue as convenções e comandos do repositório antes de propor mudanças.
- Preserve arquitetura e contratos existentes, salvo aprovação explícita.
- Nunca invente resultados de testes ou revisão.
- Não remova, ignore ou enfraqueça testes apenas para obter sucesso.
- Não execute operações destrutivas sem autorização.
- Em mudanças que envolvam múltiplos clientes, verifique isolamento de dados e autorização.
- Não faça commit, push ou merge sem pedido explícito.

## Planner
Produza `.ai/artifacts/plan.md` com objetivo, contexto, decisões, critérios de aceite, testes, passos, riscos e dúvidas. Aguarde aprovação humana antes de implementar.

## Developer
Use o plano aprovado. Para cada comportamento, demonstre RED (falha esperada), GREEN (teste passa) e REFACTOR (melhoria mantendo testes verdes). Documente comandos executados e resultados reais.

## Reviewer
Leia plano, diff e evidências. Faça revisão crítica de correção, segurança, testes, arquitetura, desempenho e manutenibilidade. Registre `.ai/artifacts/review.md`. Não edite código na etapa de review. Termine com APPROVED ou CHANGES_REQUESTED.

## Correções
Se CHANGES_REQUESTED, o Developer corrige achados fundamentados e adiciona testes de regressão. Repita no máximo 3 rodadas antes de solicitar decisão humana.