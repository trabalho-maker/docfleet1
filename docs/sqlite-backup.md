# Backup e restore do SQLite

O DocFleet usa SQLite em modo WAL. Por isso, o backup oficial nao copia apenas o arquivo `.db`.

## Comandos

```bash
npm run db:backup
npm run db:restore:test
```

## Como o backup funciona

- abre a base real configurada pelo runtime
- executa `PRAGMA wal_checkpoint(PASSIVE)` para reduzir acumulacao no WAL sem travar a operacao alem do necessario
- gera um snapshot consistente com `VACUUM INTO`
- grava o arquivo em `backups/`
- valida o backup com `PRAGMA integrity_check`
- valida chaves estrangeiras com `PRAGMA foreign_key_check`
- aplica retencao por dias

## Retencao

Por padrao, backups com mais de 14 dias sao removidos.

Voce pode alterar com:

```bash
npm run db:backup -- --retain-days=30
```

Ou com a variavel:

```bash
SQLITE_BACKUP_RETENTION=30
```

## Restore test

O comando `npm run db:restore:test`:

- localiza o backup mais recente, ou um arquivo informado por `--file=...`
- cria uma copia em `backups/restore-tests/`
- abre essa copia
- reativa `journal_mode = WAL`
- valida integridade e foreign keys

Isso nao sobrescreve a base em uso.

## Restore manual em producao interna

1. Pare a aplicacao.
2. Faça uma copia de seguranca do banco atual.
3. Substitua `data/app.db` pelo arquivo de backup desejado.
4. Remova arquivos antigos `data/app.db-wal` e `data/app.db-shm`.
5. Inicie a aplicacao novamente.
6. Rode `npm run db:restore:test -- --file=backups/<arquivo>.sqlite` antes ou depois do restore para validar o artefato.

## Observacoes

- O backup gerado por `VACUUM INTO` sai como um arquivo SQLite consistente e independente.
- O runtime do DocFleet volta a habilitar WAL automaticamente ao reabrir a base restaurada.
