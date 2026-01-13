# Excel Template Packs

Template packs live in `/templates/<packId>` and contain:
- `template.xlsm` (Excel template)
- `pack.json` (metadata + cell mappings + output sheets)

## hire-general
The `hire-general` pack uses sheets:
- Data, Worklist, Checker, Contractor, Setting, Page1..Page9

User inputs are written to the `Setting` sheet. Output sheets are `Page1`..`Page9`.

### Required mappings
```json
{
  "id": "hire-general",
  "name_th": "จัดจ้างทั่วไป",
  "caseType": "HIRE",
  "inputCells": [
    { "key": "school_name", "sheet": "Setting", "cell": "B4" },
    { "key": "school_address", "sheet": "Setting", "cell": "B5" },
    { "key": "affiliation", "sheet": "Setting", "cell": "B6" },
    { "key": "officer_name", "sheet": "Setting", "cell": "B8" },
    { "key": "head_officer_name", "sheet": "Setting", "cell": "B9" },
    { "key": "finance_officer_name", "sheet": "Setting", "cell": "B10" },
    { "key": "director_name", "sheet": "Setting", "cell": "B11" },
    { "key": "memo_no", "sheet": "Setting", "cell": "B14" },
    { "key": "memo_date_day", "sheet": "Setting", "cell": "B15" },
    { "key": "memo_date_month", "sheet": "Setting", "cell": "C15" },
    { "key": "memo_date_year", "sheet": "Setting", "cell": "D15" },
    { "key": "project_code", "sheet": "Setting", "cell": "B17" },
    { "key": "contractor_code", "sheet": "Setting", "cell": "B37" },
    { "key": "work_order_no", "sheet": "Setting", "cell": "B57" },
    { "key": "work_order_date_day", "sheet": "Setting", "cell": "B58" },
    { "key": "work_order_date_month", "sheet": "Setting", "cell": "C58" },
    { "key": "work_order_date_year", "sheet": "Setting", "cell": "D58" },
    { "key": "delivery_note_no", "sheet": "Setting", "cell": "B61" },
    { "key": "delivery_note_date_day", "sheet": "Setting", "cell": "B62" },
    { "key": "delivery_note_date_month", "sheet": "Setting", "cell": "C62" },
    { "key": "delivery_note_date_year", "sheet": "Setting", "cell": "D62" },
    { "key": "inspection_date_day", "sheet": "Setting", "cell": "B65" },
    { "key": "inspection_date_month", "sheet": "Setting", "cell": "C65" },
    { "key": "inspection_date_year", "sheet": "Setting", "cell": "D65" },
    { "key": "payment_memo_no", "sheet": "Setting", "cell": "B68" },
    { "key": "payment_request_date_day", "sheet": "Setting", "cell": "B69" },
    { "key": "payment_request_date_month", "sheet": "Setting", "cell": "C69" },
    { "key": "payment_request_date_year", "sheet": "Setting", "cell": "D69" }
  ],
  "outputSheets": ["Page1", "Page2", "Page3", "Page4", "Page5", "Page6", "Page7", "Page8", "Page9"],
  "pdfMode": "perSheet"
}
```

## Additional packs (MVP)
- `purchase-basic`: multi-sheet purchase template (default `pdfMode: singlePdf`).
- `lunch-prepared`: lunch prepared meal (`subtype: PREPARED`).
- `lunch-ingredients`: lunch ingredients (`subtype: INGREDIENTS`).
- `lunch-ingredients-cook`: lunch ingredients + cook (`subtype: INGREDIENTS_COOK`).
- `internet-lease`: internet lease (`subtype: LEASE`).
- `internet-purchase`: internet purchase (`subtype: PURCHASE`).

## Notes
- `pdfMode` can be overridden at generation time via `POST /cases/:id/documents/generate` using `"pdfMode": "perSheet"` or `"singlePdf"`.
- Input values are written to the mapped cells before LibreOffice conversion.
