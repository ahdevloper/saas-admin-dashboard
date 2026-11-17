(() => {
  "use strict";
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const state = { view:"overview", users:[...DashboardData.users], query:"" };
  const statusText = {active:"نشط",pending:"قيد المراجعة",cancelled:"ملغي"};
  const planClass = {Business:"",Professional:"",Starter:""};
  const title = $("#pageTitle"), subtitle = $("#pageSubtitle"), tableTitle = $("#tableTitle"), tableSubtitle = $("#tableSubtitle");
  const toast = (message) => {
    const node = document.createElement("div");
    node.className = "toast"; node.textContent = message;
    $("#toastContainer").append(node);
    setTimeout(() => node.remove(), 3000);
  };
  const renderUsers = () => {
    const rows = state.users.filter(user => [user.name,user.email,user.plan,statusText[user.status]].join(" ").toLowerCase().includes(state.query.toLowerCase()));
    $("#tableBody").innerHTML = rows.length ? rows.map(user => `
      <tr>
        <td><input type="checkbox" aria-label="تحديد ${user.name}" data-user-check="${user.id}"></td>
        <td><div class="user-cell"><span class="user-avatar ${user.tone}">${user.initials}</span><span class="user-meta"><strong>${user.name}</strong><small>${user.email}</small></span></div></td>
        <td><span class="plan-badge">${user.plan}</span></td>
        <td dir="ltr" style="text-align:right">${user.date}</td>
        <td><span class="status-badge ${user.status}">${statusText[user.status]}</span></td>
        <td><button class="row-menu" data-user-menu="${user.id}" aria-label="خيارات المستخدم">•••</button></td>
      </tr>`).join("") : '<tr><td colspan="6"><div class="empty-state">لا توجد نتائج مطابقة للبحث</div></td></tr>';
    $("#rowsInfo").textContent = `عرض ${rows.length} من ${state.users.length} مستخدم`;
  };
  const setView = (view) => {
    state.view = view;
    const copy = DashboardData.labels[view] || DashboardData.labels.overview;
    title.textContent = copy[0]; subtitle.textContent = copy[1];
    tableTitle.textContent = copy[2]; tableSubtitle.textContent = copy[3];
    $("#breadcrumbTitle").textContent = copy[0];
    $("#addButtonText").textContent = copy[4];
    $$(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    renderUsers();
    if(view !== "overview") toast(`تم فتح قسم ${copy[0]} — البيانات المعروضة تجريبية حالياً`);
  };
  const field = (label,name,placeholder,type="text",required=true) => `<div class="field"><label for="field-${name}">${label}</label><input id="field-${name}" name="${name}" type="${type}" placeholder="${placeholder}" ${required?"required":""}></div>`;
  const openModal = () => {
    const modal = $("#actionModal"), fields = $("#modalFields");
    $("#modalTitle").textContent = DashboardData.labels[state.view]?.[4] || "إضافة سجل";
    const userForm = state.view === "overview" || state.view === "users";
    fields.innerHTML = userForm
      ? field("الاسم الكامل","name","مثال: أحمد محمد") + field("البريد الإلكتروني","email","name@example.com","email") + '<div class="field"><label for="field-plan">الخطة</label><select id="field-plan" name="plan"><option>Starter</option><option>Professional</option><option>Business</option></select></div>'
      : field("اسم العنصر","name","أدخل الاسم") + field("الوصف","description","وصف مختصر", "text", false);
    modal.dataset.formType = userForm ? "user" : "generic";
    modal.showModal();
  };
  $$(".nav-link").forEach(button => button.addEventListener("click", () => {
    setView(button.dataset.view);
    $("#sidebar").classList.remove("open");
    $(".mobile-overlay")?.classList.remove("show");
  }));
  $("#addButton").addEventListener("click", openModal);
  $(".close-modal").addEventListener("click", () => $("#actionModal").close());
  $("#actionForm").addEventListener("submit", event => {
    if(event.submitter?.value === "cancel") return;
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if($("#actionModal").dataset.formType === "user") {
      const name = String(form.get("name") || "").trim(), email = String(form.get("email") || "").trim();
      if(!name || !email) return toast("أدخل الاسم والبريد الإلكتروني");
      state.users.unshift({id:Date.now(),name,email,initials:name.split(" ").slice(0,2).map(x=>x[0]).join(""),plan:form.get("plan"),date:new Date().toLocaleDateString("en-CA"),status:"active",tone:""});
      renderUsers(); toast("تمت إضافة المستخدم إلى البيانات التجريبية");
    } else toast("تم حفظ الإجراء محلياً كعرض تجريبي");
    $("#actionModal").close();
    event.currentTarget.reset();
  });
  $("#tableSearch").addEventListener("input", event => {state.query=event.target.value;renderUsers();});
  $("#globalSearch").addEventListener("input", event => {
    state.query=event.target.value; renderUsers();
    if(state.query) { setView("users"); $("#globalSearch").focus(); }
  });
  $("#periodSelect").addEventListener("change", event => {
    const factor = event.target.value === "7" ? .27 : event.target.value === "90" ? 2.7 : 1;
    const revenue = Math.round(84250*factor).toLocaleString("en-US");
    $('[data-stat="revenue"]').innerHTML = revenue + ' <small>ر.س</small>';
    toast("تم تحديث ملخص الفترة المحددة (بيانات تجريبية)");
  });
  $("#exportButton").addEventListener("click", () => {
    const headers = ["Name","Email","Plan","Date","Status"];
    const lines = state.users.map(user => [user.name,user.email,user.plan,user.date,statusText[user.status]].map(value => '"' + String(value).replaceAll('"','""') + '"').join(","));
    const blob = new Blob(["\uFEFF"+[headers.join(","),...lines].join("\n")],{type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href=url;link.download="saas-dashboard-users.csv";link.click();URL.revokeObjectURL(url);
    toast("تم تجهيز ملف CSV للتنزيل");
  });
  $("#viewAllButton").addEventListener("click", () => setView("users"));
  $("#selectAll").addEventListener("change", event => $$("[data-user-check]").forEach(box => box.checked=event.target.checked));
  $("#tableBody").addEventListener("click", event => {
    const menu = event.target.closest("[data-user-menu]");
    if(menu) {
      const user = state.users.find(item=>item.id===Number(menu.dataset.userMenu));
      if(user && confirm(`هل تريد حذف المستخدم ${user.name} من البيانات التجريبية؟`)) {
        state.users=state.users.filter(item=>item.id!==user.id);renderUsers();toast("تم حذف المستخدم من العرض التجريبي");
      }
    }
  });
  $("#menuToggle").addEventListener("click", () => {
    $("#sidebar").classList.toggle("open");
    let overlay = $(".mobile-overlay");
    if(!overlay){overlay=document.createElement("div");overlay.className="mobile-overlay";document.body.append(overlay);overlay.addEventListener("click",()=>{$("#sidebar").classList.remove("open");overlay.classList.remove("show");});}
    overlay.classList.toggle("show");
  });
  $("#notificationsButton").addEventListener("click", () => toast("لا توجد إشعارات جديدة"));
  $("#profileButton").addEventListener("click", () => toast("ملف أحمد ياسين — وضع العرض التجريبي"));
  $("#topProfile").addEventListener("click", () => toast("إعدادات الملف الشخصي غير مفعلة بعد"));
  $("#chartMetric").addEventListener("click", () => toast("يعرض الرسم بيانات الإيرادات التجريبية"));
  $("#todayLabel").textContent = new Date().getHours()<12 ? "صباح الخير، أحمد" : "مساء الخير، أحمد";
  renderUsers();
})();