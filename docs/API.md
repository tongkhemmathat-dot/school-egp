# API Examples

## Login (cookie-based)
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -c cookie.txt \
  -d '{"email":"admin@example.com","password":"Admin@1234"}'
```

## Get current user
```bash
curl http://localhost:4000/api/auth/me \
  -b cookie.txt
```

## Create procurement case
```bash
curl -X POST http://localhost:4000/api/cases \
  -H 'Content-Type: application/json' \
  -b cookie.txt \
  -d '{
    "title":"จัดจ้างทั่วไป",
    "reason":"ซื้อบริการที่จำเป็น",
    "caseType":"HIRE",
    "budgetAmount":12000,
    "fiscalYear":2567,
    "desiredDate":"2026-01-20",
    "vendorId":null,
    "isBackdated":false,
    "backdateReason":null,
    "lines":[{"description":"งานบริการ","quantity":1,"unitPrice":12000}]
  }'
```

## Generate document pack (optional pdfMode)
```bash
curl -X POST http://localhost:4000/api/cases/<caseId>/documents/generate \
  -H 'Content-Type: application/json' \
  -b cookie.txt \
  -d '{"packId":"hire-general","pdfMode":"perSheet","inputs":{"school_name":"โรงเรียนตัวอย่าง"}}'
```

## Override document number (backdated only)
```bash
curl -X POST http://localhost:4000/api/cases/<caseId>/documents/override-number \
  -H 'Content-Type: application/json' \
  -b cookie.txt \
  -d '{"documentId":"<docId>","number":"EGP-0001","reason":"ย้อนหลังจากการบันทึกข้อมูล","documentDate":"2026-01-01"}'
```

## Create material requisition
```bash
curl -X POST http://localhost:4000/api/inventory/requisitions \
  -H 'Content-Type: application/json' \
  -b cookie.txt \
  -d '{"requesterName":"ครูพัสดุ","warehouseId":"<warehouseId>","lines":[{"itemId":"<itemId>","quantity":2}]}'
```

## Issue requisition (creates OUT stock transactions)
```bash
curl -X POST http://localhost:4000/api/inventory/requisitions/<reqId>/issue \
  -b cookie.txt
```

## Create asset
```bash
curl -X POST http://localhost:4000/api/assets \
  -H 'Content-Type: application/json' \
  -b cookie.txt \
  -d '{"name":"เครื่องพิมพ์","assetCode":"AST-001","acquisitionDate":"2026-01-01","cost":5000,"salvageValue":0,"usefulLifeMonths":60,"policyId":"<policyId>"}'
```

## Download ZIP
```bash
curl -L http://localhost:4000/api/cases/<caseId>/documents/download-zip \
  -b cookie.txt \
  -o documents.zip
```
