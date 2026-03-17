-- Migration pour ajouter le champ deletedAt à la table Product
ALTER TABLE "Product" ADD COLUMN "deletedAt" TIMESTAMP; 