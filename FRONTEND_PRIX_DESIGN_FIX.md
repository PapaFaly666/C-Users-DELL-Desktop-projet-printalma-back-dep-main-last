📤 Payload complet envoyé: {name: 'aee', price: 1200, priceType: 'number', category: 'Mangas', hasImageBase64: true, …}category: "Mangas"hasImageBase64: trueimageBase64Size: 4005982name: "aee"price: 1200priceType: "number"tags: [][[Prototype]]: Object
designService.ts:1061 📡 Réponse /vendor/designs: 201 Created
designService.ts:1070 📥 Réponse backend: {success: true, designId: 26, message: 'Design "aee" créé avec succès', designUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/…/vendor-designs/vendor_7_design_1757873074481.png'}
designService.ts:1093 ✅ Design créé via /vendor/designs !
designService.ts:1094 💰 Prix préservé côté frontend: 1200
designService.ts:134 🍪 Utilisation de l'authentification par cookies
designService.ts:1106 🔍 Design en base: {id: 26, price: 0, prixOk: false, prixEnvoye: 1200, prixSauve: 0}
designService.ts:1115  ❌ FAIL: Prix incorrect en base: {envoyé: 1200, sauvé: 0}envoyé: 1200sauvé: 0[[Prototype]]: Object
createDesignViaVendorDesigns @ designService.ts:1115
await in createDesignViaVendorDesigns
createDesign @ designService.ts:925
designService.ts:1128 ⚠️ Attention: Le backend peut avoir mis le prix à 0 en base
designService.ts:134 🍪 Utilisation de l'authentification par cookies
SellDesignPage.tsx:2108 📄 SellDesignPage chargée!
SellDesignPage.tsx:2108 📄 SellDesignPage chargée!
designService.ts:818 ✅ Designs récupérés via /api/designs
5designService.ts:134 🍪 Utilisation de l'authentification par cookies
SellDesignPage.tsx:2108 📄 SellDesignPage chargée!
SellDesignPage.tsx:2108 📄 SellDesignPage chargée!
AuthContext.tsx:60 🔍 Vérification du statut d'authentification... {isInitialCheck: false, currentUrl: 'http://localhost:5174/vendeur/sell-design', cookies: ''}
AuthContext.tsx:72 🔄 Vérification périodique - pas de loading
AuthContext.tsx:77 🔍 Étape 0 : Vérification de la session localStorage...
auth.service.ts:162 🔍 Vérification de la session localStorage...
auth.service.ts:166 📦 Données brutes localStorage: {"timestamp":1757805061079,"user":{"id":7,"email":"pf.d@zig.univ.sn","firstName":"Papa ","lastName":"Diagne","role":"VENDEUR","vendeur_type":"DESIGNER","status":true,"profile_photo_url":"https://res.cloudinary.com/dsxab4qnu/image/upload/v1757694294/%5Bobject%20Object%5D/1757694293638-65112b0ccbec562b1933f1d7-atixel-mens-t-shirt-tops-clearance.jpg","phone":"+221773992233","shop_name":"C'est carré","country":"Sénégal","address":"Rufisque"},"isAuthenticated":true}
auth.service.ts:174 🔄 Données parsées: {timestamp: 1757805061079, user: {…}, isAuthenticated: true}
auth.service.ts:180 ⏰ Âge de la session: 68107 secondes (max: 604800 secondes)
auth.service.ts:188 ✅ Session stockée valide trouvée: {id: 7, email: 'pf.d@zig.univ.sn', firstName: 'Papa ', lastName: 'Diagne', role: 'VENDEUR', …}
auth.service.ts:189 📊 Retour: {isAuthenticated: true, user: {…}}
AuthContext.tsx:81 📱 ✅ SUCCÈS : Utilisation de la session localStorage - utilisateur connecté !
SellDesignPage.tsx:2108 📄 SellDesignPage chargée!
SellDesignPage.tsx:2108 📄 SellDesignPage chargée!
auth.service.ts:32 🔄 Requête vers: http://localhost:3004/auth/vendor/profile
auth.service.ts:33 📝 Options: {credentials: 'include', method: 'GET', headers: {…}}
auth.service.ts:48 📡 Réponse de /auth/vendor/profile: {status: 200, headers: {…}, url: 'http://localhost:3004/auth/vendor/profile'}