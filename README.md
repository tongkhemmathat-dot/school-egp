# school-egp

Thai school e-GP procurement system (Next.js + NestJS + PostgreSQL + Prisma).

## Run on Ubuntu (step-by-step)
1. Install Docker + Compose plugin.
   ```bash
   sudo apt update
   sudo apt install -y git docker.io docker-compose-plugin
   sudo systemctl enable --now docker
   sudo usermod -aG docker $USER
   ```
   Log out and log back in so the group change takes effect.
2. Clone the repo and enter the project.
   ```bash
   git clone <REPO_URL>
   cd school-egp
   ```
3. Build and start services.
   ```bash
   docker compose up -d --build
   ```
4. Run database migrations and seed demo data.
   ```bash
   docker compose exec api npm run prisma:migrate
   docker compose exec api npm run seed
   ```
5. Open the web app.
   - Web: http://localhost:3000
   - API: http://localhost:4000/api
   - Converter: http://localhost:5000

Default admin account: `admin@example.com` / `Admin@1234`.

## วิธีใช้งาน (MVP)
1. เข้าสู่ระบบด้วย Admin แล้วไปที่หน้า `/admin`.
2. สร้าง Organization และสร้างผู้ใช้ตามบทบาท (Admin, ProcurementOfficer, Approver, Viewer).
3. ไปที่หน้า `/cases` สร้างเคสใหม่ตามขั้นตอน (ข้อมูลทั่วไป → รายการ → ผู้ขาย/ประเภท → อนุมัติ → ตรวจสอบ).
4. เปิดเคสที่สร้างแล้วในแท็บ Documents แล้วเลือก Template Pack เพื่อ Generate เอกสาร PDF.
5. งานคลังวัสดุ: ไปที่ `/inventory/requisitions` สร้างใบเบิก และออกวัสดุเพื่อให้เกิด Stock OUT; ตรวจสอบได้ที่ `/inventory/stock-card`.
6. งานทรัพย์สิน: ไปที่ `/assets` เพิ่มครุภัณฑ์และดูตารางค่าเสื่อมในหน้า detail.
7. รายงานทะเบียนคุมจัดซื้อ/จัดจ้างอยู่ที่ `/reports/procurement-register`.

## Docs
- `docs/SETUP.md`
- `docs/API.md`
- `docs/RBAC.md`
- `docs/TEMPLATES.md`
- `docs/TROUBLESHOOTING.md`
