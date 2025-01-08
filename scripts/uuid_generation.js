function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function generateUUIDs() {
    const count = parseInt(document.getElementById('uuid_shuliang').value);
    const isUpperCase = document.querySelector('input[name="uuid_daxiaoxie"]:checked').value === "1";
    const removeHyphens = document.querySelector('input[name="uuid_fengefu"]:checked').value === "1";
    
    let uuids = [];
    for(let i = 0; i < count; i++) {
        let uuid = generateUUID();
        if (removeHyphens) {
            uuid = uuid.replace(/-/g, '');
        }
        if (isUpperCase) {
            uuid = uuid.toUpperCase();
        }
        uuids.push(uuid);
    }
    
    document.getElementById('jie_guo_nei_rong').textContent = uuids.join('\n');
}

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 复制功能
    document.getElementById('jie_guo_nei_rong_copy_btn').addEventListener('click', function() {
        const text = document.getElementById('jie_guo_nei_rong').textContent;
        navigator.clipboard.writeText(text).then(function() {
            const successMsg = document.getElementById('jie_guo_nei_rong_copy_btn_ok');
            successMsg.style.display = 'inline';
            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 2000);
        });
    });

    // 生成按钮事件
    document.getElementById('generate-btn').addEventListener('click', generateUUIDs);

    // 页面加载时生成一个初始UUID
    generateUUIDs();
}); 