# 🎯 Petanque Master Guide Pro

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)

เว็บแอปพลิเคชันคู่มือและระบบช่วยวิเคราะห์การเล่นเปตองระดับมืออาชีพ (**Petanque Master Guide Pro**) ที่ช่วยให้ผู้เล่นและโค้ชสามารถวางแผน วิเคราะห์เทคนิค และศึกษากฎกติกาการเล่นได้อย่างมีประสิทธิภาพ

---

## ✨ คุณสมบัติหลัก (Features)

- 🏆 **Guide & Tactics:** แนะนำเทคนิคการตีและการวางลูกเปตองในสถานการณ์ต่างๆ
- 📊 **Visual Analysis:** แสดงผลการวิเคราะห์และตำแหน่งการเล่นด้วย Visual Reference
- ⚡ **Fast & Responsive:** โหลดรวดเร็ว รองรับการใช้งานทั้งบนสมาร์ทโฟน แท็บเล็ต และคอมพิวเตอร์
- 🛠️ **Modern Tech Stack:** พัฒนาด้วย React, TypeScript และสถาปัตยกรรมที่ประมวลผลได้รวดเร็วด้วย Vite และ Bun

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend:** React + TypeScript
- **Build Tool:** Vite
- **Package Manager:** Bun
- **Styling:** CSS / Tailwind CSS

---

## 🚀 การติดตั้งและใช้งาน (Getting Started)

### สิ่งที่ต้องมีก่อนเริ่ม (Prerequisites)

- ติดตั้ง **[Bun](https://bun.sh/)** บนเครื่องของคุณ (หรือใช้ Node.js / npm / pnpm ตามที่สะดวก)

### ขั้นตอนการติดตั้ง (Installation)

1. **Clone Repository**
   ```bash
   git clone https://github.com/thitiwass-sketch/Petanque-Master.git
   cd Petanque-Master
   ```

2. **ติดตั้ง Dependencies**
   ```bash
   bun install
   ```

3. **ตั้งค่า Environment Variables**
   คัดลอกไฟล์ตัวอย่าง `.env.example` ไปเป็น `.env`
   ```bash
   cp .env.example .env
   ```

4. **รัน Development Server**
   ```bash
   bun dev
   ```
   เปิดเบราว์เซอร์ไปที่ `http://localhost:5173` เพื่อรับชมผลลัพธ์

5. **Build สำหรับ Production**
   ```bash
   bun run build
   ```

---

## 📁 โครงสร้างโฟลเดอร์ (Project Structure)

```text
Petanque-Master/
├── public/                 # ไฟล์ Static assets เช่น รูปภาพ, ไอคอน
│   └── assets/             # รูปภาพประกอบและสื่ออื่นๆ
├── src/                    # ซอร์สโค้ดหลักของแอปพลิเคชัน
│   ├── components/         # คอมโพเนนต์ React ที่นำกลับมาใช้ใหม่ได้
│   ├── pages/              # หน้าหลักของแอปพลิเคชัน
│   └── main.tsx            # จุดเริ่มต้นหลักของ React App
├── .env.example            # ไฟล์ตัวอย่าง Environment Variables
├── index.html              # HTML Template หลัก
├── package.json            # จัดการ Dependencies และ Scripts
├── tsconfig.json           # ค่าคอนฟิกสำหรับ TypeScript
└── vite.config.ts          # ค่าคอนฟิกสำหรับ Vite
```

---

## 📜 คำสั่ง Scripts ที่ใช้งานบ่อย

| คำสั่ง | คำอธิบาย |
| :--- | :--- |
| `bun dev` | สตาร์ท Development Server |
| `bun run build` | บิลด์โปรเจกต์สำหรับใช้งานจริง (Production) |
| `bun run preview` | ทดสอบเปิดดูไฟล์ที่บิลด์แล้วในโหมด Preview |

---

## 👤 ผู้พัฒนา (Author)

- **thitiwass-sketch** - [GitHub Profile](https://github.com/thitiwass-sketch)

---

⭐ หากโปรเจกต์นี้มีประโยชน์ อย่าลืมกด **Star** เพื่อเป็นกำลังใจให้ด้วยนะครับ!
