/* D&B Poutine: lightweight, local, no external translation service. */
(() => {
  const dictionary = {"Home":["Accueil","Inicio"],"Menu":["Menu","Menú"],"About":["À propos","Acerca de"],"Contact":["Contact","Contacto"],"Welcome to":["Bienvenue chez","Bienvenidos a"],"Discover the best Poutine in Ottawa!":["Découvrez la meilleure poutine à Ottawa !","¡Descubre la mejor poutine de Ottawa!"],"View Menu":["Voir le menu","Ver el menú"],"View menu":["Voir le menu","Ver el menú"],"D&B Special feature dishes":["Spécialités D&B","Especialidades D&B"],"Enjoy poutine, wings and other favourites for dine-in, takeaway or delivery in Ottawa":["Savourez nos poutines, ailes de poulet et autres plats sur place, à emporter ou en livraison à Ottawa","Disfruta de poutine, alitas y otros platos en el local, para llevar o a domicilio en Ottawa"],"D&B combo Meals":["Menus combos D&B","Combos D&B"],"D&B Combo Meals":["Menus combos D&B","Combos D&B"],"D&B Solo Menu":["Menu à la carte D&B","Menú individual D&B"],"D&B Sides (Extras)":["Accompagnements D&B","Acompañamientos D&B"],"D&B Sauces":["Sauces D&B","Salsas D&B"],"Hot and Soft Drinks":["Boissons chaudes et froides","Bebidas calientes y frías"],"Sit back and relax with one of our many hot or cold beverages.":["Détendez-vous avec une de nos boissons chaudes ou froides.","Relájate con una de nuestras bebidas calientes o frías."],"Hot Drinks":["Boissons chaudes","Bebidas calientes"],"Soft drinks":["Boissons froides","Refrescos"],"D&B Soft Drinks":["Boissons froides D&B","Refrescos D&B"],"Google Reviews":["Avis Google","Reseñas de Google"],"Business Information":["Informations pratiques","Información del negocio"],"Opening Hours":["Heures d'ouverture","Horario de apertura"],"Mon-Fri: 10:00am - 8pm":["Lun–ven : 10 h à 20 h","Lun–vie: 10:00–20:00"],"Sat: 10:00 - 6pm":["Sam : 10 h à 18 h","Sáb: 10:00–18:00"],"Sun: 10:00 - 5pm":["Dim : 10 h à 17 h","Dom: 10:00–17:00"],"Contact Information":["Coordonnées","Información de contacto"],"Social Media":["Réseaux sociaux","Redes sociales"],"Follow us on:":["Suivez-nous :","Síguenos en:"],"Discover the delicious menu at":["Découvrez le délicieux menu de","Descubre el delicioso menú de"],"Order online for delivery or collection!":["Commandez en ligne pour la livraison ou le ramassage !","¡Pide en línea para entrega o recogida!"],"Order Now":["Commander","Pedir ahora"],"Call for Collection":["Appeler pour ramasser","Llamar para recoger"],"Order on Uber Eats":["Commander sur Uber Eats","Pedir en Uber Eats"],"About Us":["À propos de nous","Sobre nosotros"],"We are":["Nous sommes","Somos"],"located in the Carlingwood shopping centre.":["situés au centre commercial Carlingwood.","ubicados en el centro comercial Carlingwood."],"At D&B Poutine, we are passionate about serving authentic Canadian poutine and other traditional dishes. Come and experience the rich flavours of our cuisine.":["Chez D&B Poutine, nous aimons servir de la poutine canadienne authentique et d'autres plats traditionnels. Venez découvrir les riches saveurs de notre cuisine.","En D&B Poutine nos apasiona servir auténtica poutine canadiense y otros platos tradicionales. Ven a descubrir los sabores de nuestra cocina."],"Our address:":["Notre adresse :","Nuestra dirección:"],"Email:":["Courriel :","Correo:"],"Phone:":["Téléphone :","Teléfono:"],"Location Map":["Carte et emplacement","Mapa y ubicación"],"Come hungry. Leave happy.":["Venez avec faim. Repartez heureux.","Ven con hambre. Sal feliz."],"Questions, cravings or feedback? We'd love to hear from you.":["Des questions, des envies ou des commentaires ? Écrivez-nous !","¿Preguntas, antojos o comentarios? ¡Nos encantaría saber de ti!"],"Get in touch":["Nous joindre","Contáctanos"],"Contact Us":["Nous contacter","Contáctanos"],"Send us a message":["Envoyez-nous un message","Envíanos un mensaje"],"Enter Your Full Name:":["Votre nom complet :","Nombre completo:"],"Enter Your Email:":["Votre courriel :","Correo electrónico:"],"Message:":["Message :","Mensaje:"],"Send Message":["Envoyer le message","Enviar mensaje"],"D&B Veggie":["Plats végétariens D&B","Opciones vegetarianas D&B"],"D&B Fried Food":["Fritures D&B","Fritos D&B"],"D&B Poutine Menu":["Menu poutine D&B","Menú de poutine D&B"],"D&B Wings Sauces":["Sauces pour ailes de poulet D&B","Salsas para alitas D&B"],"Sandwiches":["Sandwichs","Sándwiches"],"Wings":["Ailes de poulet","Alitas"],"Hotdogs":["Hot-dogs","Perritos calientes"],"Panini":["Paninis","Paninis"],"Served with Fries, D&B special sauce & Pop":["Servi avec frites, sauce spéciale D&B et boisson gazeuse","Servido con papas fritas, salsa especial D&B y refresco"],"Served with D&B special sauce & Pop":["Servi avec sauce spéciale D&B et boisson gazeuse","Servido con salsa especial D&B y refresco"],"Served with D&B special sauce, Fries & Pop":["Servi avec sauce spéciale D&B, frites et boisson gazeuse","Servido con salsa especial D&B, papas fritas y refresco"],"Served with 6 pcs of wings, D&B special sauce & Pop":["Servi avec 6 ailes de poulet, sauce spéciale D&B et boisson gazeuse","Servido con 6 alitas, salsa especial D&B y refresco"],"Served with D&B special sauce":["Servi avec la sauce spéciale D&B","Servido con salsa especial D&B"],"Plain":["Nature","Clásica"],"Small Fries":["Petites frites","Papas fritas pequeñas"],"Regular Fries":["Frites régulières","Papas fritas medianas"],"Large Fries":["Grandes frites","Papas fritas grandes"],"Onion Ring":["Rondelles d'oignon","Aros de cebolla"],"Sweet Potato":["Patate douce","Batata"],"Chicken":["Poulet","Pollo"],"Beef":["Bœuf","Ternera"],"Turkey":["Dinde","Pavo"],"Tuna":["Thon","Atún"],"Celery":["Céleri","Apio"],"Mayonnaise":["Mayonnaise","Mayonesa"],"Black Pepper":["Poivre noir","Pimienta negra"],"Tomato":["Tomate","Tomate"],"Cucumber":["Concombre","Pepino"],"Green Onion":["Oignon vert","Cebolla verde"],"Potato":["Pomme de terre","Patata"],"Lemon":["Citron","Limón"],"Olive":["Olive","Aceituna"],"Onion":["Oignon","Cebolla"],"Feta Cheese":["Fromage feta","Queso feta"],"Pita Bread":["Pain pita","Pan de pita"],"Egg":["Œuf","Huevo"],"Cauliflower":["Chou-fleur","Coliflor"],"Garlic Sauce":["Sauce à l'ail","Salsa de ajo"],"Tartar Sauce":["Sauce tartare","Salsa tártara"],"Coleslaw":["Salade de chou","Ensalada de col"],"Ketchup":["Ketchup","Kétchup"],"Ketchup Sauce":["Sauce ketchup","Salsa kétchup"],"Ranch Sauce":["Sauce ranch","Salsa ranch"],"Gravy":["Sauce brune","Salsa gravy"],"Garlic":["Ail","Ajo"],"Spinach":["Épinards","Espinacas"],"Hot Peppers":["Piments forts","Chiles picantes"],"Banana Peppers":["Piments banane","Chiles banana"],"Pickled":["Mariné","Encurtido"],"Lettuce":["Laitue","Lechuga"],"BBQ":["Barbecue","Barbacoa"],"Regular":["Régulier","Mediano"],"Large":["Grand","Grande"]};
  const codes = ['en-GB', 'en-CA', 'fr-CA', 'es'];
  const saved = (() => { try { return localStorage.getItem('dbpoutine-language'); } catch { return null; } })();
  let language = codes.includes(saved) ? saved : ({ en: 'en-CA', fr: 'fr-CA' }[saved] || 'en-CA');
  const originals = new WeakMap();
  const labels = { 'en-GB': 'Language', 'en-CA': 'Language', 'fr-CA': 'Langue', es: 'Idioma' };
  const selectors = [];
  function translate(text, lang) {
    if (lang === 'en-GB' || lang === 'en-CA') return text;
    const key = text.trim();
    if (!key) return text;
    const entry = dictionary[key];
    if (entry) return text.replace(key, entry[lang === 'fr-CA' ? 0 : 1]);
    // Translate recurring menu descriptions without altering prices or restaurant names.
    let result = key;
    const terms = lang === 'fr-CA'
      ? [['Served as ', 'Servi avec '], [' pieces of wings, with your choice of wings sauce', ' ailes de poulet, avec la sauce de votre choix'], ['Served with ', 'Servi avec '], ['Chicken Poutine', 'Poutine au poulet'], ['Veggie Poutine', 'Poutine végétarienne'], ['Chicken Panini', 'Panini au poulet'], ['Turkey Panini', 'Panini à la dinde'], ['Beef Panini', 'Panini au bœuf'], ['Chicken Sandwich', 'Sandwich au poulet'], ['Tuna Sandwich', 'Sandwich au thon'], ['Chicken Nuggets with Fries', 'Croquettes de poulet et frites'], ['Hot Dog Combo', 'Combo hot-dog'], ['Combo', 'Combo'], ['Sauce', 'Sauce']]
      : [['Served as ', 'Servido con '], [' pieces of wings, with your choice of wings sauce', ' alitas, con la salsa que elijas'], ['Served with ', 'Servido con '], ['Chicken Poutine', 'Poutine de pollo'], ['Veggie Poutine', 'Poutine vegetariana'], ['Chicken Panini', 'Panini de pollo'], ['Turkey Panini', 'Panini de pavo'], ['Beef Panini', 'Panini de ternera'], ['Chicken Sandwich', 'Sándwich de pollo'], ['Tuna Sandwich', 'Sándwich de atún'], ['Chicken Nuggets with Fries', 'Nuggets de pollo con papas fritas'], ['Hot Dog Combo', 'Combo de perrito caliente']];
    for (const [a,b] of terms) result = result.replaceAll(a,b);
    return result === key ? text : text.replace(key, result);
  }
  function apply(lang) {
    language = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('body').forEach(root => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.parentElement || node.parentElement.closest('script,style,noscript,textarea,select,option,[data-no-translate]')) return NodeFilter.FILTER_REJECT;
          return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      let node;
      while ((node = walker.nextNode())) {
        if (!originals.has(node)) originals.set(node, node.nodeValue);
        node.nodeValue = translate(originals.get(node), lang);
      }
    });
    document.querySelectorAll('[data-language-picker]').forEach(el => {
      el.value = lang;
      el.setAttribute('aria-label', labels[lang]);
      const label = el.previousElementSibling;
      if (label && label.hasAttribute('data-language-label')) label.textContent = labels[lang] + ':';
    });
    const submit = document.querySelector('input[type="submit"][value="Send Message"]');
    if (submit) submit.value = lang === 'fr-CA' ? 'Envoyer le message' : lang === 'es' ? 'Enviar mensaje' : 'Send Message';
    try { localStorage.setItem('dbpoutine-language', lang); } catch {}
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-language-picker]').forEach(el => {
      el.addEventListener('change', () => apply(el.value));
    });
    apply(language);
  });
})();
