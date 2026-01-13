# API Examples

## Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@school.local","password":"admin123"}'
```

## Create HIRE case
```bash
curl -X POST http://localhost:4000/api/cases \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"title":"จัดจ้างทั่วไป","caseType":"HIRE"}'
```

## Generate document pack
```bash
curl -X POST http://localhost:4000/api/cases/<caseId>/documents/generate \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"packId":"hire-general","inputs":{"school_name":"โรงเรียนตัวอย่าง"}}'
```

## Download ZIP
```bash
curl -L http://localhost:4000/api/cases/<caseId>/documents/download-zip \
  -H 'Authorization: Bearer <token>' \
  -o documents.zip
```
