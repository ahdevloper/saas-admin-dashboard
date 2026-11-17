window.DashboardData = {
  users: [
    {id:1,name:"سارة العتيبي",email:"sara@example.com",initials:"سع",plan:"Business",date:"2026/11/16",status:"active",tone:""},
    {id:2,name:"محمد القحطاني",email:"mohammed@example.com",initials:"مح",plan:"Professional",date:"2026/11/15",status:"active",tone:"c2"},
    {id:3,name:"نورة الحربي",email:"noura@example.com",initials:"نح",plan:"Starter",date:"2026/11/14",status:"pending",tone:"c3"},
    {id:4,name:"خالد الشهري",email:"khalid@example.com",initials:"خش",plan:"Business",date:"2026/11/13",status:"active",tone:"c4"},
    {id:5,name:"ريم المطيري",email:"reem@example.com",initials:"رم",plan:"Professional",date:"2026/11/12",status:"cancelled",tone:"c5"}
  ],
  defaults: {
    profile:{name:"أحمد ياسين",email:"ahmed@example.com",jobTitle:"مدير النظام",phone:"",location:"الرياض، المملكة العربية السعودية"},
    settings:{workspace:"Acme Studio",language:"ar",notifications:true,weeklySummary:false},
    subscriptions:[
      {id:1,customer:"سارة العتيبي",plan:"Business",amount:"299",status:"active"},
      {id:2,customer:"محمد القحطاني",plan:"Professional",amount:"149",status:"active"},
      {id:3,customer:"نورة الحربي",plan:"Starter",amount:"49",status:"pending"}
    ],
    invoices:[
      {id:1,number:"INV-2026-001",customer:"سارة العتيبي",amount:"299",status:"paid"},
      {id:2,number:"INV-2026-002",customer:"محمد القحطاني",amount:"149",status:"pending"},
      {id:3,number:"INV-2026-003",customer:"نورة الحربي",amount:"49",status:"paid"}
    ],
    products:[
      {id:1,name:"Starter",price:"49",category:"اشتراك شهري",status:"active"},
      {id:2,name:"Professional",price:"149",category:"اشتراك شهري",status:"active"},
      {id:3,name:"Business",price:"299",category:"اشتراك شهري",status:"active"}
    ],
    help:[
      {id:1,subject:"استفسار حول الاشتراك",email:"sara@example.com",status:"open",description:"مراجعة تفاصيل الاشتراك"},
      {id:2,subject:"تحديث بيانات الحساب",email:"mohammed@example.com",status:"closed",description:"طلب تحديث بيانات"}
    ]
  },
  labels: {
    overview:["نظرة عامة","إليك ملخص أداء مساحة عملك خلال الفترة الحالية.","أحدث المستخدمين","آخر الحسابات التي انضمت إلى منصتك","إضافة مستخدم"],
    analytics:["التحليلات","تابع مؤشرات الأداء واتجاهات النمو.","ملخص النشاط","مؤشرات النشاط خلال الفترة المحددة","تصدير التقرير"],
    users:["المستخدمون","إدارة حسابات المستخدمين وبياناتهم.","جميع المستخدمين","يمكنك البحث والتعديل والإضافة والحذف محلياً.","إضافة مستخدم"],
    subscriptions:["الاشتراكات","إدارة خطط الاشتراك وسجلاتها التجريبية.","جميع الاشتراكات","بيانات محلية تجريبية قابلة للتعديل.","إضافة اشتراك"],
    invoices:["الفواتير","متابعة سجلات الفواتير التجريبية.","جميع الفواتير","بيانات محلية تجريبية قابلة للتعديل.","إنشاء فاتورة"],
    products:["المنتجات","إدارة المنتجات والخطط المعروضة.","جميع المنتجات","بيانات محلية تجريبية قابلة للتعديل.","إضافة منتج"],
    settings:["الإعدادات","إدارة تفضيلات مساحة العمل محلياً.","تفضيلات مساحة العمل","تُحفظ الإعدادات على هذا المتصفح.","حفظ الإعدادات"],
    help:["المساعدة والدعم","متابعة طلبات الدعم التجريبية.","طلبات الدعم","يمكنك إضافة طلبات الدعم وإدارتها محلياً.","طلب دعم"],
    profile:["الملف الشخصي","إدارة معلومات الحساب الظاهرة في لوحة التحكم.","معلومات الحساب","تُحفظ التعديلات محلياً على هذا المتصفح.",""]
  },
  collectionFields: {
    subscriptions:[
      {label:"اسم العميل",name:"customer",placeholder:"اسم العميل"},
      {label:"الخطة",name:"plan",type:"select",options:["Starter","Professional","Business"]},
      {label:"المبلغ (ر.س)",name:"amount",type:"number",placeholder:"0"},
      {label:"الحالة",name:"status",type:"select",options:["active","pending","cancelled"]}
    ],
    invoices:[
      {label:"رقم الفاتورة",name:"number",placeholder:"INV-2026-004"},
      {label:"اسم العميل",name:"customer",placeholder:"اسم العميل"},
      {label:"المبلغ (ر.س)",name:"amount",type:"number",placeholder:"0"},
      {label:"الحالة",name:"status",type:"select",options:["paid","pending","cancelled"]}
    ],
    products:[
      {label:"اسم المنتج",name:"name",placeholder:"اسم المنتج"},
      {label:"السعر (ر.س)",name:"price",type:"number",placeholder:"0"},
      {label:"التصنيف",name:"category",placeholder:"مثال: اشتراك شهري"},
      {label:"الحالة",name:"status",type:"select",options:["active","inactive"]}
    ],
    help:[
      {label:"عنوان الطلب",name:"subject",placeholder:"عنوان طلب الدعم"},
      {label:"البريد الإلكتروني",name:"email",type:"email",placeholder:"name@example.com"},
      {label:"الوصف",name:"description",placeholder:"اكتب تفاصيل الطلب"},
      {label:"الحالة",name:"status",type:"select",options:["open","in_progress","closed"]}
    ]
  },
  collectionColumns:{
    subscriptions:[["customer","العميل"],["plan","الخطة"],["amount","المبلغ (ر.س)"],["status","الحالة"]],
    invoices:[["number","رقم الفاتورة"],["customer","العميل"],["amount","المبلغ (ر.س)"],["status","الحالة"]],
    products:[["name","المنتج"],["price","السعر (ر.س)"],["category","التصنيف"],["status","الحالة"]],
    help:[["subject","موضوع الطلب"],["email","البريد"],["description","الوصف"],["status","الحالة"]]
  }
};