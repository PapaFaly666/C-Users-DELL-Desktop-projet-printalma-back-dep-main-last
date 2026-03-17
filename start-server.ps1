Write-Host "🚀 Démarrage du serveur Printalma..." -ForegroundColor Green

# Vérifier si le serveur est déjà en cours d'exécution
Write-Host "🔍 Vérification du statut du serveur..." -ForegroundColor Yellow
$port3004 = Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue

if ($port3004) {
    Write-Host "✅ Le serveur est déjà en cours d'exécution sur le port 3004" -ForegroundColor Green
} else {
    Write-Host "❌ Aucun serveur trouvé sur le port 3004" -ForegroundColor Red
    Write-Host "🔄 Démarrage du serveur..." -ForegroundColor Yellow
    
    # Démarrer le serveur en arrière-plan
    Start-Process -FilePath "npm" -ArgumentList "run", "start:dev" -WindowStyle Hidden
    
    # Attendre que le serveur démarre
    Write-Host "⏳ Attente du démarrage du serveur..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Tester l'endpoint des meilleures ventes
Write-Host "🧪 Test de l'endpoint /public/best-sellers..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3004/public/best-sellers" -Method GET
    Write-Host "✅ Réponse reçue:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erreur lors du test:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Tester l'endpoint des produits publics
Write-Host "🧪 Test de l'endpoint /public/vendor-products..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3004/public/vendor-products?limit=5" -Method GET
    Write-Host "✅ Réponse reçue:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erreur lors du test:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "🏁 Test terminé!" -ForegroundColor Green 