/* 데일리 리포트 · 오프라인 캐시
   앱 파일을 저장해 두어 인터넷이 없어도 실행됩니다.
   내용을 고쳐 다시 올릴 때는 아래 CACHE 이름의 숫자를 올려주세요. */
var CACHE = "daily-report-v5";
var ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon-180.png", "./icon-192.png", "./icon-512.png", "./icon-maskable.png"
];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(ASSETS.map(function(u){
      return c.add(u).catch(function(){});   // 없는 파일은 건너뜁니다
    }));
  }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return k===CACHE? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* 화면 문서는 새 버전을 먼저 확인하고, 실패하면 저장된 것을 씁니다.
   나머지 파일은 저장된 것을 먼저 씁니다. */
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  if(url.origin !== location.origin) return;

  if(req.mode === "navigate" || (req.headers.get("accept")||"").indexOf("text/html") >= 0){
    e.respondWith(
      fetch(req).then(function(res){
        var copy=res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
        return res;
      }).catch(function(){
        return caches.match(req).then(function(r){ return r || caches.match("./index.html"); });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(function(r){
      return r || fetch(req).then(function(res){
        if(res && res.status===200 && res.type==="basic"){
          var copy=res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
