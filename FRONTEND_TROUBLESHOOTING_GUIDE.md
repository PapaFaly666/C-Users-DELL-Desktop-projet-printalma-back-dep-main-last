# 🚨 Guide de Résolution - Erreur 400 Bad Request

## Problème Identifié

**Error:** `auth.service.ts:39 POST http://localhost:3004/auth/admin/create-vendor-extended 400 (Bad Request)`

**Note importante:** Notre investigation a montré que le backend est **CORRECTEMENT** configuré et que l'erreur 400 est en réalité une erreur d'authentification (401) masquée.

## 🔍 Diagnostic Rapide

### 1. Vérifier l'erreur réelle
Ouvrez les outils de développement du navigateur (F12) → Onglet Network :
- Cherchez la requête `create-vendor-extended`
- Vérifiez le statut réel (probablement 401 Unauthorized)
- Regardez les headers envoyés

### 2. Vérifier le token JWT
```javascript
// Dans la console du navigateur
console.log('Token:', localStorage.getItem('token'));
console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'));
```

## 🛠 Solutions à Implémenter

### Solution 1: Vérification du Token

**Dans votre service d'authentification :**

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  private readonly API_URL = 'http://localhost:3004';

  constructor(private http: HttpClient) {}

  // Méthode pour créer un vendeur avec vendeur_type_id
  createVendorWithDynamicType(vendorData: any): Observable<any> {
    // Vérifier si le token existe
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Token JWT manquant');
      return throwError('Utilisateur non authentifié');
    }

    // Vérifier si le token est valide (non expiré)
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        console.error('❌ Token JWT expiré');
        localStorage.removeItem('token');
        return throwError('Token expiré, veuillez vous reconnecter');
      }
    } catch (error) {
      console.error('❌ Token JWT invalide');
      return throwError('Token invalide');
    }

    // Préparer les headers avec le token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      // Ne PAS définir Content-Type ici, il sera automatiquement défini pour FormData
    });

    // Préparer les données FormData
    const formData = new FormData();
    formData.append('firstName', vendorData.firstName);
    formData.append('lastName', vendorData.lastName);
    formData.append('email', vendorData.email);

    // 🎯 POINT CRITIQUE: Ajouter vendeur_type_id (prioritaire sur vendeur_type)
    if (vendorData.vendeur_type_id) {
      formData.append('vendeur_type_id', vendorData.vendeur_type_id.toString());
      console.log('✅ vendeur_type_id ajouté:', vendorData.vendeur_type_id);
    } else if (vendorData.vendeur_type) {
      // Compatibilité avec l'ancien système
      formData.append('vendeur_type', vendorData.vendeur_type);
      console.log('⚠️ vendeur_type (ancien système) ajouté:', vendorData.vendeur_type);
    }

    formData.append('shop_name', vendorData.shop_name);
    formData.append('password', vendorData.password);

    // Champs optionnels
    if (vendorData.phone) formData.append('phone', vendorData.phone);
    if (vendorData.country) formData.append('country', vendorData.country);
    if (vendorData.address) formData.append('address', vendorData.address);
    if (vendorData.photo) formData.append('photo', vendorData.photo);

    console.log('📤 Envoi de la requête avec les données:', {
      headers: headers.keys(),
      hasToken: !!token,
      vendeur_type_id: vendorData.vendeur_type_id,
      vendeur_type: vendorData.vendeur_type
    });

    return this.http.post(`${this.API_URL}/auth/admin/create-vendor-extended`, formData, {
      headers,
      observe: 'response'
    }).pipe(
      catchError(error => {
        console.error('❌ Erreur lors de la création du vendeur:', error);

        if (error.status === 401) {
          console.error('🔐 Erreur 401: Token invalide ou expiré');
          // Rediriger vers la page de login
          window.location.href = '/login';
        } else if (error.status === 400) {
          console.error('📝 Erreur 400: Données invalides');
          console.error('Détails:', error.error);
        } else if (error.status === 403) {
          console.error('🚫 Erreur 403: Permissions insuffisantes');
        }

        return throwError(error);
      })
    );
  }
}
```

### Solution 2: Intercepteur HTTP pour ajouter automatiquement le token

```typescript
// auth.interceptor.ts
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');

    if (token) {
      // Vérifier si le token est expiré
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          // Token expiré, redirection vers login
          localStorage.removeItem('token');
          window.location.href = '/login';
          return throwError('Session expirée');
        }
      } catch (error) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return throwError('Token invalide');
      }

      // Cloner la requête et ajouter le header
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });

      return next.handle(authReq);
    }

    return next.handle(req);
  }
}
```

### Solution 3: Vérification du rôle administrateur

```typescript
// Vérifier que l'utilisateur a les droits d'administrateur
checkAdminPermissions(): boolean {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!user || !user.role) {
    console.error('❌ Utilisateur non connecté ou rôle non défini');
    return false;
  }

  const adminRoles = ['SUPERADMIN', 'ADMIN'];
  const isAdmin = adminRoles.includes(user.role);

  if (!isAdmin) {
    console.error('❌ L\'utilisateur n\'a pas les permissions d\'administrateur');
    console.log('Rôle actuel:', user.role);
    return false;
  }

  console.log('✅ Permissions administrateur validées');
  return true;
}
```

## 📋 Formulaire Frontend Correct

```typescript
// Exemple de composant de formulaire
@Component({
  selector: 'app-create-vendor',
  template: `
    <form [formGroup]="vendorForm" (ngSubmit)="onSubmit()">
      <!-- Champs de base -->
      <input formControlName="firstName" placeholder="Prénom">
      <input formControlName="lastName" placeholder="Nom">
      <input formControlName="email" type="email" placeholder="Email">
      <input formControlName="shop_name" placeholder="Nom de la boutique">
      <input formControlName="password" type="password" placeholder="Mot de passe">

      <!-- 🎯 Champ critique: vendeur_type_id -->
      <select formControlName="vendeur_type_id">
        <option value="">Sélectionner un type de vendeur</option>
        <option value="1">Photographe</option>
        <option value="2">Designer</option>
        <option value="3">Artiste</option>
        <!-- Charger dynamiquement depuis l'API -->
      </select>

      <!-- Champs optionnels -->
      <input formControlName="phone" placeholder="Téléphone">
      <input formControlName="country" placeholder="Pays">
      <input formControlName="address" placeholder="Adresse">

      <!-- Upload de photo -->
      <input type="file" (change)="onPhotoSelect($event)">

      <button type="submit" [disabled]="!vendorForm.valid || loading">
        {{ loading ? 'Création...' : 'Créer le vendeur' }}
      </button>
    </form>
  `
})
export class CreateVendorComponent implements OnInit {
  vendorForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.vendorForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      vendeur_type_id: [null, Validators.required], // 🎯 Champ obligatoire
      shop_name: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [''],
      country: [''],
      address: [''],
      photo: [null]
    });

    // Charger les types de vendeurs depuis l'API
    this.loadVendorTypes();
  }

  loadVendorTypes() {
    // Appeler l'API pour charger les types de vendeurs dynamiques
    // this.authService.getVendorTypes().subscribe(...)
  }

  onSubmit() {
    if (!this.checkPrerequisites()) return;

    this.loading = true;

    const formData = {
      ...this.vendorForm.value,
      vendeur_type_id: this.vendorForm.get('vendeur_type_id')?.value
    };

    console.log('📤 Données envoyées:', formData);

    this.authService.createVendorWithDynamicType(formData).subscribe({
      next: (response) => {
        console.log('✅ Vendeur créé avec succès:', response);
        this.router.navigate(['/vendors']);
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création:', error);
        this.loading = false;
        // Afficher un message d'erreur à l'utilisateur
      }
    });
  }

  checkPrerequisites(): boolean {
    // Vérifier le token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Token manquant');
      this.router.navigate(['/login']);
      return false;
    }

    // Vérifier les permissions admin
    if (!this.authService.checkAdminPermissions()) {
      console.error('❌ Permissions insuffisantes');
      return false;
    }

    return true;
  }

  onPhotoSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.vendorForm.patchValue({ photo: file });
    }
  }
}
```

## 🔧 Checklist de Débogage

### Avant d'envoyer la requête :
- [ ] Token JWT présent dans localStorage ?
- [ ] Token non expiré ?
- [ ] Utilisateur a le rôle ADMIN/SUPERADMIN ?
- [ ] `vendeur_type_id` inclus dans les données (prioritaire sur `vendeur_type`) ?
- [ ] Headers Authorization correctement formatés (`Bearer <token>`) ?

### Structure des données attendues :
```typescript
const vendorData = {
  firstName: "Jean",
  lastName: "Photographe",
  email: "jean.photo@test.com",
  vendeur_type_id: 1, // 🎯 Obligatoire pour le nouveau système
  shop_name: "Boutique Photo Pro",
  password: "SecurePassword123!",
  phone: "+33612345678", // Optionnel
  country: "France", // Optionnel
  address: "123 Rue de la Photo", // Optionnel
  photo: File // Optionnel
};
```

## 🚨 Erreurs Communes et Solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| 400 Bad Request | Token manquant ou invalide | Vérifier le token JWT |
| 401 Unauthorized | Token expiré | Reconnecter l'utilisateur |
| 403 Forbidden | Permissions insuffisantes | Vérifier le rôle ADMIN/SUPERADMIN |
| vendeur_type_id invalide | ID non trouvé en base | Vérifier que le type de vendeur existe |

## 📞 Support

Si le problème persiste après vérification de ces points :

1. **Activer les logs détaillés dans le navigateur**
2. **Vérifier la réponse exacte du serveur** (onglet Network → Response)
3. **Contacter l'équipe backend avec les détails suivants :**
   - Token JWT (masqué)
   - Payload exact de la requête
   - Réponse complète du serveur
   - Headers envoyés

---

**Note:** L'implémentation backend est fonctionnelle et prête à recevoir les requêtes avec `vendeur_type_id`. Le problème se situe très probablement au niveau de l'authentification frontend.