# 파일 감시 및 자동 푸시 스크립트 (auto_push.ps1)
# 실행 방법: 터미널에서 `powershell -File .\auto_push.ps1` 실행

$folder = "."
$filter = "*.*"

$fsw = New-Object IO.FileSystemWatcher $folder, $filter -Property @{
    IncludeSubdirectories = $true
    EnableRaisingEvents = $true
}

Write-Host "=============================================" -ForegroundColor Green
Write-Host " HypeHeritage GitHub Auto-Push Monitoring " -ForegroundColor Green
Write-Host " 감시 시작... (종료하려면 Ctrl+C를 누르세요)" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

$action = {
    $path = $Event.SourceEventArgs.FullPath
    
    # .git 폴더 내부 변경사항 및 auto_push.ps1 자체 변경사항은 감시에서 제외
    if ($path -notmatch "\\\.git\\" -and $path -notmatch "auto_push\.ps1") {
        Write-Host "변경 감지됨: $path" -ForegroundColor Yellow
        Start-Sleep -Seconds 2 # 파일 쓰기가 완전히 완료될 때까지 대기
        
        # Git 명령어 실행
        git add .
        git commit -m "Auto-commit on file change"
        git push origin main
        
        Write-Host "GitHub 푸시 완료!" -ForegroundColor Cyan
        Write-Host "---------------------------------------------"
    }
}

$created = Register-ObjectEvent $fsw Created -Action $action
$changed = Register-ObjectEvent $fsw Changed -Action $action

# 스크립트가 백그라운드에서 계속 실행되도록 유지
try {
    while ($true) { Start-Sleep 5 }
}
finally {
    # 이벤트 구독 해제
    Unregister-Event -SourceIdentifier $created.Name
    Unregister-Event -SourceIdentifier $changed.Name
    $fsw.Dispose()
    Write-Host "감시가 종료되었습니다." -ForegroundColor Red
}
