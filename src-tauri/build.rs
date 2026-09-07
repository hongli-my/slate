fn main() {
    tauri_build::build();
    // tauri-build 只监听 tauri.conf.json / capabilities / binaries / resources，
    // 不会监听 frontendDist（前端资源经 include_bytes! 嵌入二进制）。
    // 手动监听 web 目录，确保只改前端（index.html / bundle.js）时也会重新编译嵌入。
    println!("cargo:rerun-if-changed=../web/index.html");
    println!("cargo:rerun-if-changed=../web/editor.css");
    println!("cargo:rerun-if-changed=../web/vendor/editor.bundle.js");
    println!("cargo:rerun-if-changed=../web/vendor/editor.bundle.js.map");
}
