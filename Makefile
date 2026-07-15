install:
	cd backend && npm install
	cd mobile && npm install

dev-backend:
	cd backend && npm run dev

dev-mobile:
	cd mobile && npx expo start