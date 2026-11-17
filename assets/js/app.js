(() => {
  "use strict";
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = "ahdevloper-saas-dashboard-v2";
  const statusText = {
    active:"نشط",pending:"قيد المراجعة",cancelled:"ملغي",
    paid:"مدفوعة",open:"مفتوح",in_progress:"قيد المعالجة",closed:"مغلق",inactive:"غير نشط"
  };
  const copyObject = value => JSON.parse(JSON.stringify(value));
  const readLocalState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") throw new Error("No saved state");
      return {
        users:Array.isArray(saved.users) ? saved.users : copyObject(DashboardData.users),
        profile:{...copyObject(DashboardData.defaults.profile),...(saved.profile || {})},
        settings:{...copyObject(DashboardData.defaults.settings),...(saved.settings || {})},
        records:Object.fromEntries(Object.keys(DashboardData.defaults).filter(key=>Array.isArray(DashboardData.defaults[key])).map(key=>[key,Array.isArray(saved.records?.[key])?saved.records[key]:copyObject(DashboardData.defaults[key])])),
      };
    } catch {
      return {
        users:copyObject(DashboardData.users),
        profile:copyObject(DashboardData.defaults.profile),
        settings:copyObject(DashboardData.defaults.settings),
        records:Object.fromEntries(Object.keys(DashboardData.defaults).filter(key=>Array.isArray(DashboardData.defaults[key])).map(key=>[key,copyObject(DashboardData.defaults[key])])),
      };
    }
  };
  const state = {...readLocalState(),view:"overview",query:"",page:1,editingId:null};
  const saveLocalState = () => {
    try {
      localStorage.setItem(STORAGE_KEY,JSON.stringify({
        users:state.users,profile:state.profile,settings:state.settings,records:state.records
      }));
      return true;
    } catch {
      toast("تعذر الحفظ المحلي. تحقق من مساحة تخزين المتصفح.");
      return false;
    }
  };
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const initials = name => String(name || "").trim().split(/\s+/).slice(0,2).map(part=>part.charAt(0)).join("") || "م";
  const today = () => new Date().toLocaleDateString("en-CA");
  const toast = message => {
    const container = $("#toastContainer");
    if (!container) return;
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    container.append(node);
    window.setTimeout(()=>node.remove(),3000);
  };
  const title = $("#pageTitle");
  const subtitle = $("#pageSubtitle");
  const filterRow = $(".filter-row");
  const statsGrid = $("#statsGrid");
  const dashboardGrid = $(".dashboard-grid");
  const tablePanel = $(".table-panel");
  if (filterRow && !$("#dynamicView")) filterRow.insertAdjacentHTML("afterend",'<section id="dynamicView" class="dynamic-view" hidden aria-live="polite"></section>');
  const dynamicView = $("#dynamicView");

  const updateProfileUI = () => {
    const name = state.profile.name || "مدير النظام";
    const job = state.profile.jobTitle || "مدير النظام";
    $$("#profileButton strong, #topProfile > span:nth-child(2)").forEach(node=>node.textContent=name);
    $$("#profileButton .profile-avatar, #topProfile .profile-avatar").forEach(node=>node.textContent=initials(name));
    const miniJob = $("#profileButton small");
    if (miniJob) miniJob.textContent=job;
    const eyebrow = $("#todayLabel");
    if (eyebrow) eyebrow.textContent=(new Date().getHours()<12?"صباح الخير، ":"مساء الخير، ")+name.split(" ")[0];
    const workspaceName = $(".workspace-name strong");
    if (workspaceName) workspaceName.textContent=state.settings.workspace || "مساحة العمل";
  };
  const renderUserRows = (target, limit) => {
    const filtered = state.users.filter(user=>[user.name,user.email,user.plan,statusText[user.status]].join(" ").toLocaleLowerCase("ar").includes(state.query.toLocaleLowerCase("ar")));
    const pageSize = limit || 5;
    const pageCount = Math.max(1,Math.ceil(filtered.length/pageSize));
    state.page = Math.min(state.page,pageCount);
    const start=(state.page-1)*pageSize;
    const rows=filtered.slice(start,start+pageSize);
    target.innerHTML = rows.length ? rows.map(user=>(
      '<tr>'+
      '<td><input type="checkbox" aria-label="تحديد '+escapeHTML(user.name)+'" data-user-check="'+Number(user.id)+'"></td>'+
      '<td><div class="user-cell"><span class="user-avatar '+escapeHTML(user.tone||"")+'">'+escapeHTML(user.initials||initials(user.name))+'</span><span class="user-meta"><strong>'+escapeHTML(user.name)+'</strong><small>'+escapeHTML(user.email)+'</small></span></div></td>'+
      '<td><span class="plan-badge">'+escapeHTML(user.plan)+'</span></td>'+
      '<td dir="ltr" style="text-align:right">'+escapeHTML(user.date)+'</td>'+
      '<td><span class="status-badge '+escapeHTML(user.status)+'">'+escapeHTML(statusText[user.status]||user.status)+'</span></td>'+
      '<td class="table-action-cell"><button class="table-action" data-edit-user="'+Number(user.id)+'">تعديل</button><button class="table-action danger" data-delete-user="'+Number(user.id)+'">حذف</button></td>'+
      '</tr>'
    )).join("") : '<tr><td colspan="6"><div class="empty-state">لا توجد نتائج مطابقة للبحث</div></td></tr>';
    const rowsInfo=$("#rowsInfo");
    if(rowsInfo) rowsInfo.textContent="عرض "+rows.length+" من "+filtered.length+" مستخدم";
    const selectAll=$("#selectAll");
    if(selectAll) {selectAll.checked=false;selectAll.indeterminate=false;}
    return {filtered,pageCount,start,shown:rows.length};
  };
  const renderUsers = (targetId, limit) => {
    const target=$("#"+targetId);
    if(!target) return;
    const info=renderUserRows(target,limit);
    const footer=$("#"+(targetId==="tableBody"?"pagination":"usersPagination"));
    if(footer) {
      footer.innerHTML="";
      for(let number=1;number<=info.pageCount;number++){
        const button=document.createElement("button");
        button.type="button";button.textContent=String(number);
        if(number===state.page) button.classList.add("page-active");
        button.addEventListener("click",()=>{state.page=number;renderAllUsers();});
        footer.append(button);
      }
    }
    const infoNode=$("#"+(targetId==="tableBody"?"rowsInfo":"usersRowsInfo"));
    if(infoNode && targetId!=="tableBody") infoNode.textContent="عرض "+info.shown+" من "+info.filtered.length+" مستخدم";
  };
  const renderAllUsers = () => {
    renderUsers("tableBody",5);
    if($("#usersTableBody")) renderUsers("usersTableBody",10);
    const count=$(".nav-link[data-view='users'] .nav-count");
    if(count) count.textContent=String(state.users.length);
  };
  const fieldHTML = (field,value) => {
    const val=escapeHTML(value ?? "");
    const id="field-"+field.name;
    if(field.type==="select") {
      return '<div class="field"><label for="'+id+'">'+escapeHTML(field.label)+'</label><select id="'+id+'" name="'+field.name+'">'+(field.options||[]).map(option=>'<option value="'+escapeHTML(option)+'" '+(String(value??field.options[0])===option?"selected":"")+'>'+escapeHTML(statusText[option]||option)+'</option>').join("")+'</select></div>';
    }
    return '<div class="field"><label for="'+id+'">'+escapeHTML(field.label)+'</label><input id="'+id+'" name="'+field.name+'" type="'+escapeHTML(field.type||"text")+'" value="'+val+'" placeholder="'+escapeHTML(field.placeholder||"")+'" '+(field.required===false?"":"required")+'></div>';
  };
  const openModal = (view,id) => {
    const selectedView=view || state.view;
    const modal=$("#actionModal");
    const fields=$("#modalFields");
    state.editingId=id ? Number(id) : null;
    const isUser=selectedView==="users" || selectedView==="overview";
    const current=isUser ? state.users.find(item=>Number(item.id)===Number(id)) : (state.records[selectedView]||[]).find(item=>Number(item.id)===Number(id));
    const config=isUser ? [
      {label:"الاسم الكامل",name:"name",placeholder:"الاسم الكامل"},
      {label:"البريد الإلكتروني",name:"email",type:"email",placeholder:"name@example.com"},
      {label:"الخطة",name:"plan",type:"select",options:["Starter","Professional","Business"]},
      {label:"الحالة",name:"status",type:"select",options:["active","pending","cancelled"]}
    ] : (DashboardData.collectionFields[selectedView]||[]);
    $("#modalTitle").textContent=(id?"تعديل ":"إضافة ")+(DashboardData.labels[selectedView]?.[0]||"سجل");
    fields.innerHTML=config.map(field=>fieldHTML(field,current?.[field.name] ?? (field.name==="status"?"active":undefined))).join("");
    modal.dataset.formType=isUser?"user":selectedView;
    modal.showModal();
    const first=fields.querySelector("input,select");
    if(first) first.focus();
  };
  const renderCollection = view => {
    const rows=state.records[view] || [];
    const columns=DashboardData.collectionColumns[view] || [];
    const html='<section class="panel record-panel"><div class="panel-heading"><div><h2>'+escapeHTML(DashboardData.labels[view][2])+'</h2><p>'+escapeHTML(DashboardData.labels[view][3])+'</p></div><span class="record-count">'+rows.length+' سجل</span></div>'+
      '<div class="table-scroll"><table class="record-table"><thead><tr>'+columns.map(column=>'<th>'+escapeHTML(column[1])+'</th>').join("")+'<th>الإجراءات</th></tr></thead><tbody>'+
      (rows.length?rows.map(row=>'<tr>'+columns.map(column=>{
        const value=row[column[0]];
        const isStatus=column[0]==="status";
        return '<td>'+(isStatus?'<span class="status-badge '+escapeHTML(value)+'">'+escapeHTML(statusText[value]||value)+'</span>':escapeHTML(value))+'</td>';
      }).join("")+'<td class="table-action-cell"><button class="table-action" data-edit-record="'+Number(row.id)+'" data-record-view="'+view+'">تعديل</button><button class="table-action danger" data-delete-record="'+Number(row.id)+'" data-record-view="'+view+'">حذف</button></td></tr>').join(""):'<tr><td colspan="'+(columns.length+1)+'"><div class="empty-state">لا توجد سجلات. استخدم زر الإضافة لإنشاء سجل جديد.</div></td></tr>')+
      '</tbody></table></div></section>';
    dynamicView.innerHTML=html;
  };
  const renderProfile = () => {
    const profile=state.profile;
    dynamicView.innerHTML=
      '<div class="profile-layout">'+
        '<section class="panel profile-summary"><div class="profile-large-avatar">'+escapeHTML(initials(profile.name))+'</div><h2>'+escapeHTML(profile.name)+'</h2><p>'+escapeHTML(profile.jobTitle||"")+'</p><span class="profile-local-note">حساب محلي على هذا المتصفح</span></section>'+
        '<section class="panel profile-form-panel"><div class="panel-heading"><div><h2>المعلومات الشخصية</h2><p>عدّل بيانات الحساب ثم احفظ التغييرات.</p></div></div>'+
        '<form id="profileForm" class="profile-form-grid">'+
          fieldHTML({label:"الاسم الكامل",name:"name",placeholder:"الاسم الكامل"},profile.name)+
          fieldHTML({label:"البريد الإلكتروني",name:"email",type:"email",placeholder:"name@example.com"},profile.email)+
          fieldHTML({label:"المسمى الوظيفي",name:"jobTitle",placeholder:"المسمى الوظيفي"},profile.jobTitle)+
          fieldHTML({label:"رقم الهاتف",name:"phone",placeholder:"رقم الهاتف",required:false},profile.phone)+
          fieldHTML({label:"الموقع",name:"location",placeholder:"المدينة والدولة",required:false},profile.location)+
          '<div class="profile-form-actions"><button class="button button-primary" type="submit">حفظ الملف الشخصي</button></div>'+
        '</form></section>'+
      '</div>';
  };
  const renderAnalytics = () => {
    const count=state.users.length;
    const subscriptions=state.records.subscriptions.length;
    const invoices=state.records.invoices.length;
    dynamicView.innerHTML=
      '<div class="stats-grid analytics-stats">'+
        '<article class="stat-card"><div class="stat-top"><span>سجلات المستخدمين المحلية</span><span class="stat-icon green">♙</span></div><div class="stat-value">'+count+'</div><div class="stat-foot">عدد الحسابات المحفوظة في المتصفح</div></article>'+
        '<article class="stat-card"><div class="stat-top"><span>الاشتراكات التجريبية</span><span class="stat-icon blue">◷</span></div><div class="stat-value">'+subscriptions+'</div><div class="stat-foot">سجلات قابلة للتعديل محلياً</div></article>'+
        '<article class="stat-card"><div class="stat-top"><span>الفواتير التجريبية</span><span class="stat-icon purple">▤</span></div><div class="stat-value">'+invoices+'</div><div class="stat-foot">لا تمثل مدفوعات فعلية</div></article>'+
        '<article class="stat-card"><div class="stat-top"><span>حالة التخزين</span><span class="stat-icon orange">✓</span></div><div class="stat-value">محلي</div><div class="stat-foot">Local Storage في هذا المتصفح</div></article>'+
      '</div>'+
      '<section class="panel analytics-note"><div class="panel-heading"><div><h2>حول بيانات التحليلات</h2><p>هذه مؤشرات مستمدة من سجلات العرض المحلية وليست بيانات خدمة حقيقية.</p></div></div><p>يمكنك إضافة المستخدمين والاشتراكات والفواتير وتعديلها من الأقسام المخصصة. تُحفظ تغييراتك في المتصفح الحالي ولا تتم مزامنتها مع مستخدمين أو أجهزة أخرى.</p><button class="button button-outline" id="goUsersButton">إدارة المستخدمين</button></section>';
  };
  const renderSettings = () => {
    const settings=state.settings;
    dynamicView.innerHTML=
      '<section class="panel settings-panel"><div class="panel-heading"><div><h2>إعدادات مساحة العمل</h2><p>تفضيلات محفوظة محلياً على هذا المتصفح.</p></div></div>'+
      '<form id="settingsForm" class="settings-form">'+
      fieldHTML({label:"اسم مساحة العمل",name:"workspace",placeholder:"اسم مساحة العمل"},settings.workspace)+
      '<div class="field"><label for="settingsLanguage">لغة الواجهة</label><select id="settingsLanguage" name="language"><option value="ar" '+(settings.language==="ar"?"selected":"")+'>العربية</option><option value="en" '+(settings.language==="en"?"selected":"")+'>English (واجهة العرض الحالية عربية)</option></select></div>'+
      '<label class="setting-toggle"><input type="checkbox" name="notifications" '+(settings.notifications?"checked":"")+'> <span><strong>إشعارات الواجهة</strong><small>عرض تنبيهات الإجراءات داخل لوحة التحكم.</small></span></label>'+
      '<label class="setting-toggle"><input type="checkbox" name="weeklySummary" '+(settings.weeklySummary?"checked":"")+'> <span><strong>ملخص أسبوعي</strong><small>تفضيل تجريبي محفوظ محلياً فقط.</small></span></label>'+
      '<div class="profile-form-actions"><button class="button button-primary" type="submit">حفظ الإعدادات</button></div></form></section>';
  };
  const renderHelp = () => {
    const view=DashboardData.labels.help;
    renderCollection("help");
  };
  const setView = (view,options={}) => {
    if(!DashboardData.labels[view] && view!=="profile") view="overview";
    state.view=view;
    state.page=1;
    const copy=DashboardData.labels[view] || DashboardData.labels.overview;
    title.textContent=copy[0];
    subtitle.textContent=copy[1];
    $("#breadcrumbTitle").textContent=copy[0];
    $("#addButtonText").textContent=copy[4];
    $$(".nav-link").forEach(button=>button.classList.toggle("active",button.dataset.view===view));
    const isOverview=view==="overview";
    statsGrid.hidden=!isOverview;
    dashboardGrid.hidden=!isOverview;
    tablePanel.hidden=!isOverview;
    dynamicView.hidden=isOverview;
    filterRow.hidden=!(view==="overview"||view==="analytics");
    $("#addButton").hidden=!["overview","users","subscriptions","invoices","products","help"].includes(view);
    $("#exportButton").hidden=!["overview","analytics","users"].includes(view);
    if(isOverview) {
      tableTitle.textContent=copy[2];tableSubtitle.textContent=copy[3];
      dynamicView.innerHTML="";
      renderAllUsers();
    } else if(view==="users") {
      dynamicView.innerHTML='<section class="panel record-panel"><div class="panel-heading"><div><h2>جميع المستخدمين</h2><p>ابحث في الحسابات وأضفها أو عدّلها أو احذفها.</p></div><label class="table-search"><span>⌕</span><input id="usersSearch" type="search" placeholder="بحث بالاسم أو البريد..."></label></div><div class="table-scroll"><table><thead><tr><th><input type="checkbox" id="usersSelectAll" aria-label="تحديد الكل"></th><th>المستخدم</th><th>الخطة</th><th>تاريخ التسجيل</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody id="usersTableBody"></tbody></table></div><div class="table-footer"><span id="usersRowsInfo"></span><div id="usersPagination" class="pagination"></div></div></section>';
      renderUsers("usersTableBody",10);
      $("#usersSearch").value=state.query;
    } else if(view==="profile") renderProfile();
    else if(view==="analytics") renderAnalytics();
    else if(view==="settings") renderSettings();
    else if(DashboardData.collectionColumns[view]) renderCollection(view);
    if(!options.keepScroll) window.scrollTo({top:0,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  };

  $$(".nav-link").forEach(button=>button.addEventListener("click",()=>{
    setView(button.dataset.view);
    closeMobileMenu();
  }));
  const closeMobileMenu = () => {
    $("#sidebar").classList.remove("open");
    $(".mobile-overlay")?.classList.remove("show");
  };
  $("#brandHome")?.addEventListener("click",event=>{event.preventDefault();setView("overview");closeMobileMenu();});
  $(".brand")?.addEventListener("click",event=>{event.preventDefault();setView("overview");});
  $(".workspace-switch")?.addEventListener("click",()=>setView("settings"));
  $("#profileButton").addEventListener("click",()=>setView("profile"));
  $("#topProfile").addEventListener("click",()=>setView("profile"));
  $("#addButton").addEventListener("click",()=>{
    if(state.view==="overview") openModal("users");
    else openModal(state.view);
  });
  $(".close-modal").addEventListener("click",()=>$("#actionModal").close());
  $("#actionForm").addEventListener("submit",event=>{
    if(event.submitter?.value==="cancel") return;
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    const type=$("#actionModal").dataset.formType;
    const values=Object.fromEntries(form.entries());
    if(type==="user") {
      const name=String(values.name||"").trim();
      const email=String(values.email||"").trim();
      if(!name||!email) return toast("أدخل الاسم والبريد الإلكتروني.");
      const existing=state.users.find(item=>Number(item.id)===Number(state.editingId));
      const record={
        ...(existing||{}),id:existing?existing.id:Date.now(),name,email,
        initials:initials(name),plan:values.plan,status:values.status||"active",
        date:existing?.date||today(),tone:existing?.tone||""
      };
      if(existing) state.users=state.users.map(item=>item.id===existing.id?record:item);
      else state.users.unshift(record);
      state.query="";
      $("#tableSearch").value="";
      toast(existing?"تم تحديث المستخدم وحفظه محلياً.":"تمت إضافة المستخدم وحفظه محلياً.");
    } else {
      const rows=state.records[type] || [];
      const existing=rows.find(item=>Number(item.id)===Number(state.editingId));
      const record={...(existing||{}),...values,id:existing?existing.id:Date.now()};
      if(type==="help" && !record.status) record.status="open";
      if(existing) state.records[type]=rows.map(item=>item.id===existing.id?record:item);
      else state.records[type]=[record,...rows];
      toast(existing?"تم تحديث السجل محلياً.":"تمت إضافة السجل محلياً.");
    }
    saveLocalState();
    $("#actionModal").close();
    event.currentTarget.reset();
    state.editingId=null;
    if(state.view==="overview") renderAllUsers();
    else setView(state.view,{keepScroll:true});
  });

  document.addEventListener("click",event=>{
    const editUser=event.target.closest("[data-edit-user]");
    const deleteUser=event.target.closest("[data-delete-user]");
    const editRecord=event.target.closest("[data-edit-record]");
    const deleteRecord=event.target.closest("[data-delete-record]");
    if(editUser) openModal("users",editUser.dataset.editUser);
    if(deleteUser) {
      const id=Number(deleteUser.dataset.deleteUser);
      const user=state.users.find(item=>Number(item.id)===id);
      if(user && window.confirm("حذف المستخدم "+user.name+" من البيانات المحلية؟")) {
        state.users=state.users.filter(item=>Number(item.id)!==id);saveLocalState();
        state.page=1;renderAllUsers();toast("تم حذف المستخدم من التخزين المحلي.");
      }
    }
    if(editRecord) openModal(editRecord.dataset.recordView,editRecord.dataset.editRecord);
    if(deleteRecord) {
      const view=deleteRecord.dataset.recordView,id=Number(deleteRecord.dataset.deleteRecord);
      const rows=state.records[view]||[];
      if(window.confirm("هل تريد حذف هذا السجل من البيانات المحلية؟")) {
        state.records[view]=rows.filter(item=>Number(item.id)!==id);saveLocalState();setView(view,{keepScroll:true});toast("تم حذف السجل محلياً.");
      }
    }
    if(event.target.closest("#goUsersButton")) setView("users");
  });

  $("#tableSearch").addEventListener("input",event=>{state.query=event.target.value;state.page=1;renderAllUsers();});
  $("#globalSearch").addEventListener("input",event=>{
    const value=event.target.value;
    state.query=value;state.page=1;
    if(value && state.view!=="users") setView("users",{keepScroll:true});
    else if(state.view==="users") renderUsers("usersTableBody",10);
    else renderAllUsers();
  });
  dynamicView.addEventListener("input",event=>{
    if(event.target.id==="usersSearch") {
      state.query=event.target.value;state.page=1;renderUsers("usersTableBody",10);
      const field=$("#usersSearch");field?.focus();field?.setSelectionRange(field.value.length,field.value.length);
    }
  });
  $("#selectAll").addEventListener("change",event=>$$("[data-user-check]").forEach(box=>box.checked=event.target.checked));
  dynamicView.addEventListener("change",event=>{
    if(event.target.id==="usersSelectAll") $$("[data-user-check]",dynamicView).forEach(box=>box.checked=event.target.checked);
  });
  $("#viewAllButton").addEventListener("click",()=>setView("users"));
  $("#periodSelect").addEventListener("change",event=>{
    const factor=event.target.value==="7"?.27:event.target.value==="90"?2.7:1;
    const revenue=Math.round(84250*factor).toLocaleString("en-US");
    $('[data-stat="revenue"]').innerHTML=revenue+' <small>ر.س</small>';
    toast("تم تحديث الفترة المعروضة. المؤشرات توضيحية وليست بيانات مباشرة.");
  });

  const exportUsers = () => {
    const headers=["Name","Email","Plan","Date","Status"];
    const lines=state.users.map(user=>[user.name,user.email,user.plan,user.date,statusText[user.status]||user.status].map(value=>'"'+String(value??"").replace(/"/g,'""')+'"').join(","));
    const blob=new Blob(["\uFEFF"+[headers.join(","),...lines].join("\n")],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob),link=document.createElement("a");
    link.href=url;link.download="saas-dashboard-users.csv";document.body.append(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast("تم إنشاء ملف CSV من البيانات المحلية.");
  };
  $("#exportButton").addEventListener("click",exportUsers);
  $("#notificationsButton").addEventListener("click",()=>toast(state.settings.notifications?"لا توجد إشعارات جديدة.":"الإشعارات معطلة من إعدادات الواجهة."));
  $("#chartMetric").addEventListener("click",()=>{
    const bars=$("#revenueBars");
    const button=$("#chartMetric");
    const subscriptions=button.dataset.metric!=="subscriptions";
    button.dataset.metric=subscriptions?"subscriptions":"revenue";
    button.innerHTML=(subscriptions?"الاشتراكات":"الإيرادات")+' <span>⌄</span>';
    if(bars) {
      const heights=subscriptions?[34,52,45,68,61,79]:[42,57,48,72,63,88];
      $$(".bar-column > i",bars).forEach((bar,index)=>{bar.style.height=heights[index]+"%";});
    }
    toast(subscriptions?"تم عرض توزيع توضيحي للاشتراكات.":"تم عرض الإيرادات التوضيحية.");
  });

  $("#actionForm").addEventListener("reset",()=>{state.editingId=null;});
  dynamicView.addEventListener("submit",event=>{
    if(event.target.id==="profileForm") {
      event.preventDefault();
      const form=new FormData(event.target),values=Object.fromEntries(form.entries());
      if(!String(values.name||"").trim()||!String(values.email||"").trim()) return toast("الاسم والبريد الإلكتروني مطلوبان.");
      state.profile={...state.profile,...values};
      saveLocalState();updateProfileUI();renderProfile();
      toast("تم تحديث الملف الشخصي وحفظه محلياً.");
    }
    if(event.target.id==="settingsForm") {
      event.preventDefault();
      const form=new FormData(event.target);
      state.settings={
        workspace:String(form.get("workspace")||"").trim()||"مساحة العمل",
        language:String(form.get("language")||"ar"),
        notifications:form.get("notifications")==="on",
        weeklySummary:form.get("weeklySummary")==="on"
      };
      saveLocalState();updateProfileUI();toast("تم حفظ الإعدادات على هذا المتصفح.");
    }
  });

  $("#menuToggle").addEventListener("click",()=>{
    const sidebar=$("#sidebar");
    let overlay=$(".mobile-overlay");
    if(!overlay) {
      overlay=document.createElement("div");overlay.className="mobile-overlay";
      document.body.append(overlay);
      overlay.addEventListener("click",closeMobileMenu);
    }
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show",sidebar.classList.contains("open"));
  });
  document.addEventListener("keydown",event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k") {
      event.preventDefault();$("#globalSearch").focus();
    }
    if(event.key==="Escape") closeMobileMenu();
  });
  window.addEventListener("resize",()=>{if(window.innerWidth>900) closeMobileMenu();});
  const profileEmail=state.profile.email;
  updateProfileUI();
  renderAllUsers();
  setView("overview",{keepScroll:true});
})();