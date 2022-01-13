DISTFILE=WatchRaptor.zip

pack:
	rm -rf dist "${DISTFILE}"
	npm run build:release
	cd dist ; zip -9 -r ../${DISTFILE} *
	ls -lh "${DISTFILE}"
