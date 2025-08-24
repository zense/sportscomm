# 🏃‍♂️ Running and Testing the Sports Equipment Management App

## 🌟 Current Status
✅ **Application is RUNNING** at: `http://localhost:3000`  
✅ **Development server active** with hot reload  
✅ **All TypeScript errors resolved**  
✅ **Build system working correctly**  

## 🧪 Testing Checklist

### 1. **Basic Application Flow**
- [ ] Visit `http://localhost:3000`
- [ ] Verify redirect to `/login` page
- [ ] Check login interface loads correctly
- [ ] Test navigation and responsive design

### 2. **Frontend Components Test**
- [ ] Login component renders
- [ ] UI components (buttons, inputs, cards) work
- [ ] Authentication context initializes
- [ ] Dashboard routes exist

### 3. **API Endpoints Test**
Run these in browser developer tools or Postman:

```javascript
// Test API connectivity
fetch('/api/admin/dashboard')
  .then(r => console.log('Dashboard API:', r.status))

fetch('/api/student/transactions')
  .then(r => console.log('Student API:', r.status))
```

### 4. **Database Connection**
```bash
# Check if MongoDB is running
npm run test-db
```

## 🚀 Full Setup for Complete Testing

### Step 1: Database Setup
```bash
# Option A: Local MongoDB
mongod --dbpath ./data

# Option B: MongoDB Cloud (Atlas)
# Update MONGODB_URI in .env.local
```

### Step 2: Microsoft Azure AD (Optional for Auth Testing)
1. Create Azure App Registration
2. Update `.env.local` with:
   - `MICROSOFT_CLIENT_ID`
   - `MICROSOFT_CLIENT_SECRET`
   - `MICROSOFT_AUTHORITY`

### Step 3: Create Test Data
```bash
# Run seed script (if created)
npm run seed

# Or test with default admin:
# Email: admin@college.edu
# Password: ChangeThisPassword123!
```

## 🔍 What You Should See

### Landing Page (`/`)
- Redirects to login if not authenticated
- Shows loading spinner during auth check
- Smart routing based on user role

### Login Page (`/login`)
- Microsoft login button
- Role verification for Coach/Admin
- Clean, professional interface

### Dashboard Pages
- **Student**: Equipment requests, transaction history, certificates
- **Coach**: Student management, attendance tracking
- **Admin**: Full system management, reports, exports

## 🛠️ Troubleshooting

### Common Issues:
1. **Port 3000 in use**: Change port with `npm run dev -- -p 3001`
2. **Database connection**: Check MongoDB is running
3. **Environment variables**: Verify `.env.local` file
4. **Build errors**: Run `npm run build` to check for issues

### Debug Commands:
```bash
# Check application health
curl http://localhost:3000/api/health

# View server logs
npm run dev -- --verbose

# Test API endpoints
npm run test-api
```

## 📱 Testing Scenarios

### Authentication Flow
1. Visit homepage → redirects to login
2. Click Microsoft login → should show auth popup
3. Select role (Coach/Admin) → password verification
4. Successful login → redirect to appropriate dashboard

### Student Workflow
1. Login as student → student dashboard
2. Request equipment → create transaction
3. Mark equipment taken → update status
4. Return equipment → complete transaction
5. Generate no-dues certificate → download PDF

### Coach Workflow
1. Login as coach → coach dashboard
2. View students in sport → filtered list
3. Mark attendance → create attendance records
4. View attendance history → paginated records

### Admin Workflow
1. Login as admin → admin dashboard
2. View equipment logbook → all transactions
3. Manage coaches → CRUD operations
4. Export data → Excel/PDF downloads
5. Approve returns → update transaction status

## 🎯 Key Features to Test

- [ ] **Authentication**: Microsoft login integration
- [ ] **Authorization**: Role-based access control
- [ ] **Equipment Management**: Request/return workflow
- [ ] **Attendance Tracking**: Coach attendance features
- [ ] **Admin Controls**: System management
- [ ] **Data Export**: PDF/Excel generation
- [ ] **Responsive Design**: Mobile/desktop compatibility

## 📊 Performance Testing

```bash
# Test application performance
npm run lighthouse

# Check bundle size
npm run analyze

# Test API response times
npm run benchmark
```

---

**🎉 Happy Testing!** Your application is ready for comprehensive testing and development.
