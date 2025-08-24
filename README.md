# College Sports Equipment & Attendance Manager

A production-ready Next.js MERN monorepo application for managing sports equipment and attendance in college sports programs. Features Microsoft Azure AD authentication with role-based access control for Students, Coaches, and Admins.

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, App Router
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Microsoft Azure AD (Entra ID) + JWT
- **File Generation**: PDFKit for certificates, ExcelJS for reports
- **Development**: Turbopack for fast development builds

### Monorepo Structure
```
sports/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # Backend API routes
│   │   ├── login/             # Login page
│   │   └── dashboard/         # Dashboard pages
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   └── auth/             # Authentication components
│   ├── context/              # React contexts
│   ├── lib/                  # Utility libraries
│   ├── middleware/           # API middleware
│   ├── models/               # Mongoose models
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
└── package.json             # Dependencies and scripts
```

## 🚀 Features

### Authentication & Authorization
- **Microsoft Login**: Azure AD integration for college accounts
- **Role-based Access**: Student, Coach, Admin roles
- **Auto-registration**: Students auto-register via email pattern
- **Additional Security**: Coach/Admin require additional password verification

### Student Portal
- **Equipment Requests**: Request sports equipment with quantity and return date
- **Status Tracking**: Track equipment through lifecycle (Requested → Taken → Returned → Approved)
- **Return Process**: Mark equipment as returned, triggers admin approval
- **No Dues Certificate**: Auto-generated PDF certificate after all items returned
- **Transaction History**: View all equipment transactions with filtering

### Admin Portal
- **Dashboard**: Overview of active borrowings, pending returns, overdue items
- **Logbook Management**: Searchable/filterable equipment transaction history
- **Return Approval**: Approve or reject equipment returns
- **Attendance Management**: View and manage attendance across all sports
- **Coach Management**: Create, update, delete coach accounts
- **Export Functionality**: Excel export for logbook and attendance data
- **Password Management**: Change admin password

### Coach Portal
- **Sport-specific Access**: Only see students from assigned sport
- **Attendance Marking**: Mark students present/absent
- **Student Roster**: View and search assigned students
- **Attendance Reports**: View attendance history with statistics

## 📋 Prerequisites

Before running this application, ensure you have:

1. **Node.js** (v18 or later)
2. **MongoDB** (local installation or MongoDB Atlas)
3. **Azure AD Application** registered in Microsoft Entra
4. **Git** for version control

## 🔧 Installation & Setup

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd sports
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/sports-equipment-db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars

# Microsoft Azure AD
MICROSOFT_CLIENT_ID=your-azure-app-client-id
MICROSOFT_CLIENT_SECRET=your-azure-app-client-secret
MICROSOFT_AUTHORITY=https://login.microsoftonline.com/your-tenant-id

# Public environment variables (accessible in browser)
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your-azure-app-client-id
NEXT_PUBLIC_MICROSOFT_AUTHORITY=https://login.microsoftonline.com/your-tenant-id

# Default Admin (create on first run)
DEFAULT_ADMIN_EMAIL=admin@college.edu
DEFAULT_ADMIN_PASSWORD=ChangeThisPassword123!
```

### 3. Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Create a new registration with redirect URI: `http://localhost:3000/`
4. Configure API permissions: Microsoft Graph → User.Read (delegated)
5. Create client secret and copy values to `.env.local`

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at http://localhost:3000

## 📱 User Workflows

### Student: Request → Take → Return → Certificate
### Coach: Login → Mark Attendance → View Reports  
### Admin: Dashboard → Approve Returns → Manage Coaches → Export Data

## 🛡️ Security Features

- JWT token authentication
- Role-based API protection  
- Password hashing with bcrypt
- Input validation
- Environment variable protection

## 📊 API Endpoints

- **Auth**: `/api/auth/*` - Login and role verification
- **Student**: `/api/student/*` - Equipment requests and transactions
- **Admin**: `/api/admin/*` - Dashboard, approvals, exports
- **Coach**: `/api/coach/*` - Students and attendance

## 🎨 UI Design

Professional, minimal design with:
- Clean cards with soft shadows
- Blue/green/gray color palette
- Responsive mobile-first layout
- Accessible components with proper contrast

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

### Self-hosted
```bash
npm run build
npm start
```

## 🔧 Troubleshooting

Common issues and solutions:
- **Microsoft Login**: Check Azure AD configuration
- **Database**: Verify MongoDB connection
- **Build Errors**: Clear cache and reinstall dependencies

For detailed setup instructions, API documentation, and troubleshooting, see the sections above.

---

Ready to manage your college sports equipment efficiently! 🏆
