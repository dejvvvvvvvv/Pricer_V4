import React from 'react';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';

const Support = () => {
  const { t, language } = useLanguage();
  
  const faqs = language === 'cs' ? [
    {
      category: 'Začínáme',
      questions: [
        {
          q: 'Jak začít používat ModelPricer?',
          a: 'Stačí se zaregistrovat, nastavit ceny v admin panelu a vložit widget kód na svůj web. Celý proces zabere jen pár minut.'
        },
        {
          q: 'Potřebuji mít vlastní server nebo instalovat PrusaSlicer?',
          a: 'Ne. PrusaSlicer běží na našem serveru, takže nemusíš nic instalovat ani spravovat.'
        },
        {
          q: 'Jak vložím kalkulačku na svůj web?',
          a: 'V admin panelu v sekci "Widget Code" najdeš jednoduchý kód, který stačí zkopírovat a vložit na svůj web.'
        }
      ]
    },
    {
      category: 'Ceny a poplatky',
      questions: [
        {
          q: 'Můžu používat vlastní ceny a poplatky?',
          a: 'Ano. V administraci si nastavíš ceny za gram materiálu, hodinovou sazbu a jakékoliv další poplatky (montáž, lakování, energie, atd.).'
        },
        {
          q: 'Jak se počítá cena tisku?',
          a: 'Cena = (hmotnost × cena materiálu) + (čas tisku × hodinová sazba) + poplatky. Všechny parametry si nastavuješ sám.'
        },
        {
          q: 'Můžu mít různé ceny pro různé materiály?',
          a: 'Ano, můžeš nastavit vlastní cenu za gram pro každý materiál (PLA, ABS, PETG, TPU, atd.).'
        }
      ]
    },
    {
      category: 'Technické',
      questions: [
        {
          q: 'Co když je model větší než moje tiskárna?',
          a: 'V adminu nastavíš maximální rozměry podle své tiskárny. Systém automaticky odmítne modely, které jsou příliš velké.'
        },
        {
          q: 'Jaké formáty souborů podporujete?',
          a: 'Aktuálně podporujeme STL soubory. Další formáty (OBJ, 3MF) plánujeme v budoucnu.'
        },
        {
          q: 'Jak dlouho trvá slicing?',
          a: 'Většina modelů se slicuje do 30 sekund. Složitější modely mohou trvat až 2 minuty.'
        },
        {
          q: 'Můžu si upravit vzhled kalkulačky?',
          a: 'Ano, v sekci "Branding" si můžeš nastavit barvy, logo, fonty a další vizuální prvky.'
        }
      ]
    },
    {
      category: 'Účet a fakturace',
      questions: [
        {
          q: 'Můžu změnit tarif kdykoliv?',
          a: 'Ano, můžeš kdykoliv upgradovat nebo downgradovat svůj tarif. Změna se projeví od následujícího měsíce.'
        },
        {
          q: 'Nabízíte roční slevu?',
          a: 'Ano, při roční platbě získáš 20% slevu oproti měsíčnímu předplatnému.'
        },
        {
          q: 'Co když překročím limit kalkulací?',
          a: 'Systém tě upozorní emailem. Můžeš buď upgradovat tarif nebo dokoupit extra balíček kalkulací.'
        }
      ]
    }
  ] : [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I start using ModelPricer?',
          a: 'Just register, set prices in the admin panel, and embed the widget code on your website. The whole process takes just a few minutes.'
        },
        {
          q: 'Do I need my own server or install PrusaSlicer?',
          a: 'No. PrusaSlicer runs on our server, so you don\'t need to install or manage anything.'
        },
        {
          q: 'How do I embed the calculator on my website?',
          a: 'In the admin panel under "Widget Code" you\'ll find simple code to copy and paste on your website.'
        }
      ]
    },
    {
      category: 'Pricing & Fees',
      questions: [
        {
          q: 'Can I use custom prices and fees?',
          a: 'Yes. In the admin panel you can set prices per gram of material, hourly rates, and any additional fees (assembly, painting, energy, etc.).'
        },
        {
          q: 'How is the print price calculated?',
          a: 'Price = (weight × material price) + (print time × hourly rate) + fees. You set all parameters yourself.'
        },
        {
          q: 'Can I have different prices for different materials?',
          a: 'Yes, you can set custom price per gram for each material (PLA, ABS, PETG, TPU, etc.).'
        }
      ]
    },
    {
      category: 'Technical',
      questions: [
        {
          q: 'What if the model is larger than my printer?',
          a: 'In the admin panel you set maximum dimensions based on your printer. The system automatically rejects models that are too large.'
        },
        {
          q: 'What file formats do you support?',
          a: 'We currently support STL files. Additional formats (OBJ, 3MF) are planned for the future.'
        },
        {
          q: 'How long does slicing take?',
          a: 'Most models slice within 30 seconds. More complex models may take up to 2 minutes.'
        },
        {
          q: 'Can I customize the calculator appearance?',
          a: 'Yes, in the "Branding" section you can set colors, logo, fonts, and other visual elements.'
        }
      ]
    },
    {
      category: 'Account & Billing',
      questions: [
        {
          q: 'Can I change my plan anytime?',
          a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect from the next month.'
        },
        {
          q: 'Do you offer annual discounts?',
          a: 'Yes, you get 20% off with annual payment compared to monthly subscription.'
        },
        {
          q: 'What if I exceed the calculation limit?',
          a: 'The system will notify you by email. You can either upgrade your plan or purchase an extra calculation package.'
        }
      ]
    }
  ];

  const quickLinks = language === 'cs' ? [
    { icon: 'BookOpen', title: 'Dokumentace', desc: 'Kompletní návody a tutoriály' },
    { icon: 'Video', title: 'Video návody', desc: 'Krok za krokem videa' },
    { icon: 'MessageCircle', title: 'Live Chat', desc: 'Okamžitá podpora online' },
    { icon: 'Mail', title: 'Email podpora', desc: 'support@modelpricer.com' }
  ] : [
    { icon: 'BookOpen', title: 'Documentation', desc: 'Complete guides and tutorials' },
    { icon: 'Video', title: 'Video Tutorials', desc: 'Step-by-step videos' },
    { icon: 'MessageCircle', title: 'Live Chat', desc: 'Instant online support' },
    { icon: 'Mail', title: 'Email Support', desc: 'support@modelpricer.com' }
  ];

  return (
    <div className="support-page">
      <section className="support-hero">
        <div className="container">
          <h1>{t('support.hero.title')}</h1>
          <p>{t('support.hero.subtitle')}</p>
          <div className="search-box">
            <Icon name="Search" size={20} />
            <input type="text" placeholder={t('support.search.placeholder')} />
          </div>
        </div>
      </section>

      <section className="quick-links">
        <div className="container">
          <div className="links-grid">
            {quickLinks.map((link, index) => (
              <div key={index} className="link-card">
                <Icon name={link.icon} size={32} />
                <h3>{link.title}</h3>
                <p>{link.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="container">
          <h2>{language === 'cs' ? 'Často kladené otázky' : 'Frequently Asked Questions'}</h2>
          {faqs.map((category, index) => (
            <div key={index} className="faq-category">
              <h3>{category.category}</h3>
              <div className="questions">
                {category.questions.map((item, i) => (
                  <div key={i} className="faq-item">
                    <h4>{item.q}</h4>
                    <p>{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="contact-section">
        <div className="container">
          <div className="contact-card">
            <h2>{t('support.contact.title')}</h2>
            <p>{t('support.contact.subtitle')}</p>
            <div className="contact-methods">
              <div className="method">
                <Icon name="Mail" size={24} />
                <div>
                  <strong>Email</strong>
                  <p>support@modelpricer.com</p>
                </div>
              </div>
              <div className="method">
                <Icon name="MessageCircle" size={24} />
                <div>
                  <strong>Live Chat</strong>
                  <p>{language === 'cs' ? 'Po-Pá 9:00-17:00' : 'Mon-Fri 9:00-17:00'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .support-page {
          width: 100%;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .support-hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 120px 0 80px 0;
          text-align: center;
        }

        .support-hero h1 {
          font-size: 48px;
          font-weight: 700;
          margin: 0 0 16px 0;
        }

        .support-hero p {
          font-size: 20px;
          opacity: 0.95;
          margin-bottom: 40px;
        }

        .search-box {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }

        .search-box input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 16px;
          color: #111827;
        }

        .quick-links {
          padding: 80px 0;
        }

        .links-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .link-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .link-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          border-color: #667eea;
        }

        .link-card h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 16px 0 8px 0;
          color: #111827;
        }

        .link-card p {
          font-size: 14px;
          color: #6B7280;
          margin: 0;
        }

        .faq-section {
          background: #f9fafb;
          padding: 80px 0;
        }

        .faq-section h2 {
          font-size: 36px;
          font-weight: 700;
          text-align: center;
          margin: 0 0 60px 0;
          color: #111827;
        }

        .faq-category {
          max-width: 900px;
          margin: 0 auto 48px auto;
        }

        .faq-category h3 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 24px 0;
          color: #667eea;
        }

        .questions {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-item {
          background: white;
          padding: 24px;
          border-radius: 12px;
        }

        .faq-item h4 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #111827;
        }

        .faq-item p {
          font-size: 14px;
          color: #6B7280;
          line-height: 1.6;
          margin: 0;
        }

        .contact-section {
          padding: 80px 0;
        }

        .contact-card {
          max-width: 700px;
          margin: 0 auto;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 60px;
          border-radius: 16px;
          text-align: center;
        }

        .contact-card h2 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 16px 0;
        }

        .contact-card p {
          font-size: 18px;
          opacity: 0.95;
          margin-bottom: 40px;
        }

        .contact-methods {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .method {
          background: rgba(255,255,255,0.1);
          padding: 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
          text-align: left;
        }

        .method strong {
          display: block;
          font-size: 16px;
          margin-bottom: 4px;
        }

        .method p {
          font-size: 14px;
          margin: 0;
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .links-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .contact-methods {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Support;
