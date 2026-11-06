<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>@yield('title') — Presensi Cafe</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#FAF9F6;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
.card{background:#fff;border-radius:20px;padding:40px 32px;max-width:420px;text-align:center;box-shadow:0 20px 50px rgba(169,121,31,.12);border:1px solid #E7E2DB;}
.code{font-size:56px;font-weight:800;background:linear-gradient(135deg,#D9A93B,#A9791F);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:8px;}
h1{font-size:18px;color:#24211D;margin-bottom:10px;}
p{font-size:14px;color:#6B6459;line-height:1.6;margin-bottom:24px;}
a{display:inline-block;background:linear-gradient(135deg,#D9A93B,#A9791F);color:#fff;text-decoration:none;padding:11px 24px;border-radius:10px;font-size:14px;font-weight:700;}
</style>
</head>
<body>
    <div class="card">
        <div class="code">@yield('code')</div>
        <h1>@yield('judul')</h1>
        <p>@yield('pesan')</p>
        <a href="{{ rtrim(config('langganan.frontend_url'), '/') }}">Kembali ke Beranda</a>
    </div>
</body>
</html>
