// =============================================================
// Sugar & Glaze — SVG Illustrations
// Детальні векторні ілюстрації для hero, placeholder тощо
// =============================================================

const ILLUSTRATIONS = {

  // ===========================================================
  // cakeHero — тришаровий весільний торт для hero-секції
  // ViewBox: 0 0 340 420
  // ===========================================================
  cakeHero: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 420" role="img" aria-label="Торт Sugar and Glaze">
  <defs>
    <linearGradient id="il-t1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#B8845A"/>
      <stop offset="18%" stop-color="#EDD5B0"/>
      <stop offset="82%" stop-color="#E8CFA8"/>
      <stop offset="100%" stop-color="#B8845A"/>
    </linearGradient>
    <radialGradient id="il-t1f" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#FFF8F0"/>
      <stop offset="100%" stop-color="#F0E0C8"/>
    </radialGradient>
    <linearGradient id="il-t2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#A84060"/>
      <stop offset="18%" stop-color="#EDA0B8"/>
      <stop offset="82%" stop-color="#E895B0"/>
      <stop offset="100%" stop-color="#A84060"/>
    </linearGradient>
    <radialGradient id="il-t2f" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#FFF0F5"/>
      <stop offset="100%" stop-color="#F5D0DC"/>
    </radialGradient>
    <linearGradient id="il-t3" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#C0A880"/>
      <stop offset="18%" stop-color="#FFF8F0"/>
      <stop offset="82%" stop-color="#F8F0E4"/>
      <stop offset="100%" stop-color="#C0A880"/>
    </linearGradient>
    <radialGradient id="il-t3f" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F5EDE0"/>
    </radialGradient>
    <linearGradient id="il-gold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E8C060"/>
      <stop offset="100%" stop-color="#906010"/>
    </linearGradient>
    <radialGradient id="il-pipe" cx="50%" cy="20%" r="80%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F0E4D0"/>
    </radialGradient>
    <radialGradient id="il-plate" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#FFFAF4"/>
      <stop offset="80%" stop-color="#F0E4D0"/>
      <stop offset="100%" stop-color="#D8C0A0"/>
    </radialGradient>
  </defs>

  <!-- Декоративні зірочки на фоні -->
  <g opacity="0.65">
    <line x1="30" y1="45" x2="30" y2="65" stroke="#D4A847" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="20" y1="55" x2="40" y2="55" stroke="#D4A847" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="23" y1="48" x2="37" y2="62" stroke="#D4A847" stroke-width="1" stroke-linecap="round"/>
    <line x1="37" y1="48" x2="23" y2="62" stroke="#D4A847" stroke-width="1" stroke-linecap="round"/>
  </g>
  <g opacity="0.55">
    <line x1="307" y1="60" x2="307" y2="78" stroke="#F0A0B8" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="298" y1="69" x2="316" y2="69" stroke="#F0A0B8" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="300" y1="62" x2="314" y2="76" stroke="#F0A0B8" stroke-width="1" stroke-linecap="round"/>
    <line x1="314" y1="62" x2="300" y2="76" stroke="#F0A0B8" stroke-width="1" stroke-linecap="round"/>
  </g>
  <g opacity="0.4" transform="translate(18,200)">
    <line x1="0" y1="-5" x2="0" y2="5" stroke="#C9A84C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="-5" y1="0" x2="5" y2="0" stroke="#C9A84C" stroke-width="1.5" stroke-linecap="round"/>
  </g>
  <g opacity="0.4" transform="translate(322,220)">
    <line x1="0" y1="-5" x2="0" y2="5" stroke="#F0A0B8" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="-5" y1="0" x2="5" y2="0" stroke="#F0A0B8" stroke-width="1.5" stroke-linecap="round"/>
  </g>
  <circle cx="22" cy="290" r="3" fill="#F8C8C8" opacity="0.5"/>
  <circle cx="318" cy="300" r="2.5" fill="#C9A84C" opacity="0.5"/>
  <circle cx="32" cy="155" r="2" fill="#D4A847" opacity="0.4"/>
  <circle cx="308" cy="145" r="2" fill="#F5A0B8" opacity="0.4"/>

  <!-- ===== ПІДСТАВКА ===== -->
  <rect x="148" y="394" width="44" height="20" rx="4" fill="#DCC8A8"/>
  <rect x="152" y="396" width="8" height="14" rx="2" fill="#EDD8B8" opacity="0.6"/>
  <ellipse cx="170" cy="414" rx="75" ry="9" fill="#DCC8A8"/>
  <ellipse cx="170" cy="412" rx="75" ry="9" fill="#E8D8B8"/>
  <ellipse cx="170" cy="410" rx="72" ry="8" fill="#F0E4CC"/>
  <ellipse cx="170" cy="393" rx="148" ry="14" fill="#E0CCAA"/>
  <ellipse cx="170" cy="391" rx="148" ry="14" fill="#EDD8B8"/>
  <ellipse cx="170" cy="389" rx="144" ry="13" fill="url(#il-plate)"/>
  <ellipse cx="170" cy="389" rx="144" ry="13" fill="none" stroke="#D4B890" stroke-width="1.5"/>
  <ellipse cx="170" cy="388" rx="130" ry="10" fill="none" stroke="#E8D5B8" stroke-width="1"/>

  <!-- ===== НИЖНІЙ ЯРУС ===== -->
  <ellipse cx="170" cy="386" rx="130" ry="10" fill="#80500020" opacity="0.4"/>
  <rect x="38" y="295" width="264" height="82" rx="6" fill="url(#il-t1)"/>
  <rect x="38" y="358" width="264" height="19" rx="0 0 6 6" fill="#A07040" opacity="0.2"/>
  <line x1="38" y1="320" x2="302" y2="320" stroke="#C09060" stroke-width="0.5" opacity="0.25"/>
  <line x1="38" y1="342" x2="302" y2="342" stroke="#C09060" stroke-width="0.5" opacity="0.25"/>
  <ellipse cx="170" cy="295" rx="132" ry="18" fill="url(#il-t1f)"/>
  <ellipse cx="170" cy="295" rx="132" ry="18" fill="none" stroke="#F0E0C8" stroke-width="2" opacity="0.7"/>
  <ellipse cx="170" cy="295" rx="118" ry="12" fill="#D4A847" opacity="0.28"/>
  <ellipse cx="155" cy="293" rx="60" ry="6" fill="#E8C060" opacity="0.22"/>

  <!-- Золоті патьоки нижнього ярусу -->
  <path d="M 82 296 Q 80 308 81 324 Q 82 337 80 347 Q 79 353 80 357" stroke="url(#il-gold)" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.88"/>
  <ellipse cx="80" cy="359" rx="6" ry="5" fill="#8A5C10" opacity="0.88"/>
  <path d="M 115 296 Q 113 307 114 319 Q 115 326 113 331" stroke="url(#il-gold)" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.82"/>
  <ellipse cx="113" cy="333" rx="4.5" ry="3.5" fill="#A07020" opacity="0.85"/>
  <path d="M 156 296 Q 154 311 155 327 Q 156 341 154 352 Q 153 360 154 367" stroke="url(#il-gold)" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.88"/>
  <ellipse cx="154" cy="369" rx="6" ry="5" fill="#8A5C10" opacity="0.88"/>
  <path d="M 193 296 Q 191 309 192 322 Q 193 332 191 337" stroke="url(#il-gold)" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.82"/>
  <ellipse cx="191" cy="339" rx="4.5" ry="3.5" fill="#A07020" opacity="0.85"/>
  <path d="M 229 296 Q 227 307 228 320 Q 229 330 227 340 Q 226 346 227 351" stroke="url(#il-gold)" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.88"/>
  <ellipse cx="227" cy="353" rx="5.5" ry="4.5" fill="#8A5C10" opacity="0.88"/>
  <path d="M 262 296 Q 260 305 261 313" stroke="url(#il-gold)" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.75"/>
  <ellipse cx="261" cy="315" rx="4" ry="3" fill="#B08030" opacity="0.8"/>

  <!-- Перлинні крапки на нижньому ярусі -->
  <circle cx="60" cy="330" r="3.5" fill="#FFF5EB" opacity="0.7"/>
  <circle cx="60" cy="330" r="2" fill="#FFFFFF" opacity="0.5"/>
  <circle cx="290" cy="335" r="3.5" fill="#FFF5EB" opacity="0.7"/>
  <circle cx="290" cy="335" r="2" fill="#FFFFFF" opacity="0.5"/>
  <circle cx="70" cy="352" r="2.5" fill="#FFF5EB" opacity="0.5"/>
  <circle cx="280" cy="355" r="2.5" fill="#FFF5EB" opacity="0.5"/>

  <!-- Хвиляста кремова окантовка знизу ярусу -->
  <path d="M 38 366 Q 44 360 50 366 Q 56 360 62 366 Q 68 360 74 366 Q 80 360 86 366 Q 92 360 98 366 Q 104 360 110 366 Q 116 360 122 366 Q 128 360 134 366 Q 140 360 146 366 Q 152 360 158 366 Q 164 360 170 366 Q 176 360 182 366 Q 188 360 194 366 Q 200 360 206 366 Q 212 360 218 366 Q 224 360 230 366 Q 236 360 242 366 Q 248 360 254 366 Q 260 360 266 366 Q 272 360 278 366 Q 284 360 290 366 Q 296 360 302 366"
        stroke="url(#il-pipe)" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.85"/>

  <!-- ===== СЕРЕДНІЙ ЯРУС ===== -->
  <ellipse cx="170" cy="293" rx="90" ry="8" fill="#60300020" opacity="0.4"/>
  <rect x="80" y="216" width="180" height="79" rx="6" fill="url(#il-t2)"/>
  <rect x="80" y="277" width="180" height="18" rx="0 0 6 6" fill="#803050" opacity="0.2"/>
  <line x1="80" y1="238" x2="260" y2="238" stroke="#C06080" stroke-width="0.5" opacity="0.25"/>
  <line x1="80" y1="258" x2="260" y2="258" stroke="#C06080" stroke-width="0.5" opacity="0.25"/>
  <ellipse cx="170" cy="216" rx="90" ry="13" fill="url(#il-t2f)"/>
  <ellipse cx="170" cy="216" rx="90" ry="13" fill="none" stroke="#F5D0DC" stroke-width="2" opacity="0.7"/>
  <ellipse cx="170" cy="216" rx="76" ry="8" fill="#D4A847" opacity="0.25"/>

  <!-- Золоті патьоки середнього ярусу -->
  <path d="M 106 217 Q 104 228 105 240 Q 106 249 104 257" stroke="url(#il-gold)" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.88"/>
  <ellipse cx="104" cy="259" rx="5" ry="4" fill="#8A5C10" opacity="0.88"/>
  <path d="M 138 217 Q 136 226 137 234" stroke="url(#il-gold)" stroke-width="5.5" fill="none" stroke-linecap="round" opacity="0.82"/>
  <ellipse cx="137" cy="236" rx="4" ry="3" fill="#A07020" opacity="0.82"/>
  <path d="M 170 217 Q 168 230 169 243 Q 170 253 168 261 Q 167 267 168 271" stroke="url(#il-gold)" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.88"/>
  <ellipse cx="168" cy="273" rx="5.5" ry="4.5" fill="#8A5C10" opacity="0.88"/>
  <path d="M 202 217 Q 200 228 201 239 Q 202 247 200 253" stroke="url(#il-gold)" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.82"/>
  <ellipse cx="200" cy="255" rx="4.5" ry="3.5" fill="#A07020" opacity="0.85"/>
  <path d="M 234 217 Q 232 226 233 234" stroke="url(#il-gold)" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.75"/>
  <ellipse cx="233" cy="236" rx="4" ry="3" fill="#B08030" opacity="0.8"/>

  <!-- Квіти на середньому ярусі (ліва троянда) -->
  <ellipse cx="107" cy="258" rx="8" ry="9" fill="#C04065" opacity="0.92" transform="rotate(-20 107 258)"/>
  <ellipse cx="114" cy="250" rx="8" ry="9" fill="#C04065" opacity="0.92" transform="rotate(10 114 250)"/>
  <ellipse cx="122" cy="252" rx="8" ry="9" fill="#D05070" opacity="0.92" transform="rotate(35 122 252)"/>
  <ellipse cx="124" cy="262" rx="8" ry="9" fill="#D05070" opacity="0.92" transform="rotate(60 124 262)"/>
  <ellipse cx="117" cy="270" rx="8" ry="9" fill="#C04065" opacity="0.92" transform="rotate(-60 117 270)"/>
  <ellipse cx="108" cy="268" rx="8" ry="9" fill="#C04065" opacity="0.92" transform="rotate(-40 108 268)"/>
  <ellipse cx="112" cy="256" rx="6" ry="7" fill="#E06080" transform="rotate(-10 112 256)"/>
  <ellipse cx="118" cy="253" rx="6" ry="7" fill="#E06080" transform="rotate(20 118 253)"/>
  <ellipse cx="123" cy="259" rx="6" ry="7" fill="#E06080" transform="rotate(45 123 259)"/>
  <ellipse cx="118" cy="266" rx="6" ry="7" fill="#E06080" transform="rotate(-30 118 266)"/>
  <ellipse cx="112" cy="266" rx="6" ry="7" fill="#E06080" transform="rotate(-50 112 266)"/>
  <circle cx="116" cy="260" r="6" fill="#F090A8"/>
  <circle cx="116" cy="260" r="4" fill="#F8B0C8"/>
  <circle cx="115" cy="259" r="2.5" fill="#FFD0DC"/>
  <circle cx="114" cy="257" r="1.2" fill="#FFFFFF" opacity="0.7"/>

  <!-- Права троянда -->
  <ellipse cx="218" cy="255" rx="7.5" ry="8.5" fill="#B03058" opacity="0.92" transform="rotate(-15 218 255)"/>
  <ellipse cx="225" cy="248" rx="7.5" ry="8.5" fill="#B03058" opacity="0.92" transform="rotate(15 225 248)"/>
  <ellipse cx="232" cy="251" rx="7.5" ry="8.5" fill="#C04068" opacity="0.92" transform="rotate(40 232 251)"/>
  <ellipse cx="233" cy="261" rx="7.5" ry="8.5" fill="#C04068" opacity="0.92" transform="rotate(65 233 261)"/>
  <ellipse cx="226" cy="268" rx="7.5" ry="8.5" fill="#B03058" opacity="0.92" transform="rotate(-55 226 268)"/>
  <ellipse cx="219" cy="265" rx="7.5" ry="8.5" fill="#B03058" opacity="0.92" transform="rotate(-35 219 265)"/>
  <ellipse cx="222" cy="254" rx="5.5" ry="6.5" fill="#D86080" transform="rotate(-5 222 254)"/>
  <ellipse cx="228" cy="252" rx="5.5" ry="6.5" fill="#D86080" transform="rotate(25 228 252)"/>
  <ellipse cx="232" cy="258" rx="5.5" ry="6.5" fill="#D86080" transform="rotate(50 232 258)"/>
  <ellipse cx="227" cy="264" rx="5.5" ry="6.5" fill="#D86080" transform="rotate(-25 227 264)"/>
  <ellipse cx="221" cy="264" rx="5.5" ry="6.5" fill="#D86080" transform="rotate(-45 221 264)"/>
  <circle cx="225" cy="258" r="6" fill="#F088A5"/>
  <circle cx="225" cy="258" r="4" fill="#F8A8C0"/>
  <circle cx="224" cy="257" r="2.5" fill="#FFD0DC"/>
  <circle cx="223" cy="255" r="1.2" fill="#FFFFFF" opacity="0.7"/>

  <!-- Листочки між квітами -->
  <ellipse cx="143" cy="258" rx="9" ry="4" fill="#4A8040" opacity="0.88" transform="rotate(-25 143 258)"/>
  <ellipse cx="157" cy="263" rx="8" ry="3.5" fill="#5A9048" opacity="0.82" transform="rotate(10 157 263)"/>
  <ellipse cx="195" cy="258" rx="8" ry="4" fill="#4A8040" opacity="0.88" transform="rotate(25 195 258)"/>
  <ellipse cx="207" cy="263" rx="7" ry="3.5" fill="#5A9048" opacity="0.82" transform="rotate(-15 207 263)"/>

  <!-- Хвиляста окантовка знизу середнього ярусу -->
  <path d="M 80 283 Q 86 277 92 283 Q 98 277 104 283 Q 110 277 116 283 Q 122 277 128 283 Q 134 277 140 283 Q 146 277 152 283 Q 158 277 164 283 Q 170 277 176 283 Q 182 277 188 283 Q 194 277 200 283 Q 206 277 212 283 Q 218 277 224 283 Q 230 277 236 283 Q 242 277 248 283 Q 254 277 260 283"
        stroke="url(#il-pipe)" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.88"/>

  <!-- ===== ВЕРХНІЙ ЯРУС ===== -->
  <ellipse cx="170" cy="214" rx="62" ry="7" fill="#60300020" opacity="0.4"/>
  <rect x="108" y="148" width="124" height="68" rx="6" fill="url(#il-t3)"/>
  <rect x="108" y="200" width="124" height="16" rx="0 0 6 6" fill="#806040" opacity="0.15"/>
  <ellipse cx="170" cy="148" rx="62" ry="10" fill="url(#il-t3f)"/>
  <ellipse cx="170" cy="148" rx="62" ry="10" fill="none" stroke="#F5EDE0" stroke-width="2" opacity="0.7"/>
  <ellipse cx="170" cy="148" rx="50" ry="7" fill="#D4A847" opacity="0.22"/>

  <!-- Золота стрічка на верхньому ярусі -->
  <path d="M 108 168 Q 170 163 232 168" stroke="#C9A84C" stroke-width="2" fill="none" opacity="0.72"/>
  <path d="M 108 181 Q 170 176 232 181" stroke="#C9A84C" stroke-width="2" fill="none" opacity="0.72"/>
  <line x1="138" y1="167" x2="138" y2="203" stroke="#C9A84C" stroke-width="1.2" opacity="0.4"/>
  <line x1="170" y1="166" x2="170" y2="203" stroke="#C9A84C" stroke-width="1.2" opacity="0.4"/>
  <line x1="202" y1="167" x2="202" y2="203" stroke="#C9A84C" stroke-width="1.2" opacity="0.4"/>
  <polygon points="138,168 141,171 138,174 135,171" fill="#D4A847" opacity="0.75"/>
  <polygon points="170,167 173,170 170,173 167,170" fill="#D4A847" opacity="0.75"/>
  <polygon points="202,168 205,171 202,174 199,171" fill="#D4A847" opacity="0.75"/>

  <!-- Хвиляста окантовка знизу верхнього ярусу -->
  <path d="M 108 207 Q 112 201 116 207 Q 120 201 124 207 Q 128 201 132 207 Q 136 201 140 207 Q 144 201 148 207 Q 152 201 156 207 Q 160 201 164 207 Q 168 201 172 207 Q 176 201 180 207 Q 184 201 188 207 Q 192 201 196 207 Q 200 201 204 207 Q 208 201 212 207 Q 216 201 220 207 Q 224 201 228 207 Q 232 201 232 207"
        stroke="url(#il-pipe)" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.88"/>

  <!-- ===== КВІТКОВИЙ ДЕКОР НА ВЕРШИНІ ===== -->
  <!-- Листочки (позаду квітів) -->
  <ellipse cx="128" cy="138" rx="14" ry="5" fill="#3A7030" opacity="0.92" transform="rotate(-35 128 138)"/>
  <ellipse cx="134" cy="124" rx="12" ry="4.5" fill="#4A8040" opacity="0.88" transform="rotate(-15 134 124)"/>
  <ellipse cx="172" cy="113" rx="13" ry="5" fill="#3A7030" opacity="0.88" transform="rotate(-5 172 113)"/>
  <ellipse cx="208" cy="126" rx="13" ry="4.5" fill="#4A8040" opacity="0.88" transform="rotate(20 208 126)"/>
  <ellipse cx="214" cy="140" rx="12" ry="5" fill="#3A7030" opacity="0.92" transform="rotate(40 214 140)"/>
  <ellipse cx="160" cy="148" rx="10" ry="4" fill="#4A8040" opacity="0.82" transform="rotate(15 160 148)"/>
  <ellipse cx="182" cy="148" rx="10" ry="4" fill="#4A8040" opacity="0.82" transform="rotate(-20 182 148)"/>

  <!-- Центральна глибока-рожева троянда -->
  <ellipse cx="161" cy="132" rx="12" ry="13" fill="#A83055" opacity="0.97" transform="rotate(-25 161 132)"/>
  <ellipse cx="171" cy="124" rx="12" ry="13" fill="#A83055" opacity="0.97" transform="rotate(5 171 124)"/>
  <ellipse cx="182" cy="128" rx="12" ry="13" fill="#B8405E" opacity="0.97" transform="rotate(30 182 128)"/>
  <ellipse cx="184" cy="140" rx="12" ry="13" fill="#B8405E" opacity="0.97" transform="rotate(55 184 140)"/>
  <ellipse cx="175" cy="148" rx="12" ry="13" fill="#A83055" opacity="0.97" transform="rotate(-55 175 148)"/>
  <ellipse cx="163" cy="146" rx="12" ry="13" fill="#A83055" opacity="0.97" transform="rotate(-40 163 146)"/>
  <ellipse cx="166" cy="128" rx="9" ry="10" fill="#C85070"/>
  <ellipse cx="174" cy="125" rx="9" ry="10" fill="#C85070"/>
  <ellipse cx="181" cy="132" rx="9" ry="10" fill="#C85070"/>
  <ellipse cx="178" cy="141" rx="9" ry="10" fill="#C85070"/>
  <ellipse cx="170" cy="145" rx="9" ry="10" fill="#C85070"/>
  <ellipse cx="163" cy="139" rx="9" ry="10" fill="#C85070"/>
  <circle cx="172" cy="135" r="9" fill="#E07090"/>
  <circle cx="172" cy="135" r="6.5" fill="#F090A8"/>
  <circle cx="171" cy="134" r="4" fill="#F8B0C4"/>
  <circle cx="169" cy="132" r="2" fill="#FFFFFF" opacity="0.65"/>

  <!-- Кремова троянда (права) -->
  <ellipse cx="197" cy="134" rx="9" ry="10" fill="#EDD8C0" opacity="0.97" transform="rotate(-20 197 134)"/>
  <ellipse cx="205" cy="128" rx="9" ry="10" fill="#EDD8C0" opacity="0.97" transform="rotate(10 205 128)"/>
  <ellipse cx="212" cy="133" rx="9" ry="10" fill="#E8D0B8" opacity="0.97" transform="rotate(35 212 133)"/>
  <ellipse cx="212" cy="143" rx="9" ry="10" fill="#E8D0B8" opacity="0.97" transform="rotate(60 212 143)"/>
  <ellipse cx="206" cy="149" rx="9" ry="10" fill="#EDD8C0" opacity="0.97" transform="rotate(-55 206 149)"/>
  <ellipse cx="198" cy="146" rx="9" ry="10" fill="#EDD8C0" opacity="0.97" transform="rotate(-35 198 146)"/>
  <ellipse cx="201" cy="131" rx="7" ry="7.5" fill="#F5E8D5"/>
  <ellipse cx="208" cy="132" rx="7" ry="7.5" fill="#F5E8D5"/>
  <ellipse cx="211" cy="139" rx="7" ry="7.5" fill="#F5E8D5"/>
  <ellipse cx="206" cy="145" rx="7" ry="7.5" fill="#F5E8D5"/>
  <ellipse cx="199" cy="143" rx="7" ry="7.5" fill="#F5E8D5"/>
  <circle cx="204" cy="138" r="6.5" fill="#FFF5EB"/>
  <circle cx="204" cy="138" r="4.5" fill="#FFFAF4"/>
  <circle cx="202" cy="136" r="1.5" fill="#FFFFFF" opacity="0.7"/>

  <!-- Темно-бордова троянда (ліва) -->
  <ellipse cx="144" cy="135" rx="8.5" ry="9.5" fill="#802040" opacity="0.97" transform="rotate(-20 144 135)"/>
  <ellipse cx="151" cy="128" rx="8.5" ry="9.5" fill="#802040" opacity="0.97" transform="rotate(10 151 128)"/>
  <ellipse cx="157" cy="131" rx="8.5" ry="9.5" fill="#902848" opacity="0.97" transform="rotate(35 157 131)"/>
  <ellipse cx="158" cy="141" rx="8.5" ry="9.5" fill="#902848" opacity="0.97" transform="rotate(60 158 141)"/>
  <ellipse cx="151" cy="147" rx="8.5" ry="9.5" fill="#802040" opacity="0.97" transform="rotate(-55 151 147)"/>
  <ellipse cx="144" cy="144" rx="8.5" ry="9.5" fill="#802040" opacity="0.97" transform="rotate(-35 144 144)"/>
  <ellipse cx="148" cy="131" rx="6" ry="6.5" fill="#B03858"/>
  <ellipse cx="154" cy="129" rx="6" ry="6.5" fill="#B03858"/>
  <ellipse cx="157" cy="135" rx="6" ry="6.5" fill="#B03858"/>
  <ellipse cx="153" cy="142" rx="6" ry="6.5" fill="#B03858"/>
  <ellipse cx="147" cy="141" rx="6" ry="6.5" fill="#B03858"/>
  <circle cx="151" cy="136" r="5.5" fill="#D06080"/>
  <circle cx="151" cy="136" r="3.5" fill="#E08099"/>
  <circle cx="150" cy="134" r="1.5" fill="#FFFFFF" opacity="0.6"/>

  <!-- Полуниця -->
  <path d="M 122 136 Q 116 124 119 116 Q 122 110 126 113 Q 132 108 136 115 Q 139 122 135 133 Z" fill="#D02030"/>
  <path d="M 122 136 Q 116 124 119 116 Q 122 110 124 113" fill="#E83040" opacity="0.55"/>
  <path d="M 128 110 Q 122 102 120 97" stroke="#4A8040" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="121" cy="106" rx="6" ry="3" fill="#5A9048" opacity="0.92" transform="rotate(-30 121 106)"/>
  <ellipse cx="130" cy="107" rx="5" ry="2.5" fill="#4A8040" opacity="0.92" transform="rotate(15 130 107)"/>
  <circle cx="124" cy="125" r="1" fill="#FFF0F0"/>
  <circle cx="130" cy="122" r="1" fill="#FFF0F0"/>
  <circle cx="128" cy="129" r="1" fill="#FFF0F0"/>
  <circle cx="122" cy="129" r="1" fill="#FFF0F0"/>
  <circle cx="133" cy="127" r="0.8" fill="#FFF0F0"/>
  <circle cx="125" cy="133" r="0.8" fill="#FFF0F0"/>
  <path d="M 120 118 Q 119 122 121 125" stroke="#FF8090" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.7"/>

  <!-- Чорниця -->
  <circle cx="218" cy="145" r="7.5" fill="#4550A0"/>
  <circle cx="218" cy="145" r="7.5" fill="none" stroke="#303888" stroke-width="0.5"/>
  <circle cx="229" cy="140" r="7" fill="#3A4595"/>
  <circle cx="229" cy="140" r="7" fill="none" stroke="#283080" stroke-width="0.5"/>
  <circle cx="224" cy="152" r="6.5" fill="#4D58A8"/>
  <circle cx="215" cy="141" r="2.5" fill="#8090C8" opacity="0.72"/>
  <circle cx="227" cy="137" r="2" fill="#8090C8" opacity="0.72"/>
  <circle cx="222" cy="149" r="2" fill="#8090C8" opacity="0.65"/>

  <!-- Золоте листя -->
  <ellipse cx="138" cy="118" rx="8" ry="2.5" fill="#D4A847" opacity="0.88" transform="rotate(-50 138 118)"/>
  <ellipse cx="203" cy="117" rx="8" ry="2.5" fill="#D4A847" opacity="0.88" transform="rotate(50 203 117)"/>
  <ellipse cx="170" cy="111" rx="7" ry="2.5" fill="#C9A84C" opacity="0.82" transform="rotate(-5 170 111)"/>

  <!-- ===== СВІЧКИ ===== -->
  <!-- Свічка 1 (слонова кістка) -->
  <rect x="149" y="100" width="10" height="30" rx="4" fill="#FFF8F0"/>
  <rect x="149" y="100" width="10" height="30" rx="4" fill="none" stroke="#E8D5B0" stroke-width="0.8"/>
  <line x1="149" y1="113" x2="159" y2="113" stroke="#E8D5B0" stroke-width="1.5" opacity="0.4"/>
  <line x1="149" y1="120" x2="159" y2="120" stroke="#E8D5B0" stroke-width="1.5" opacity="0.4"/>
  <path d="M 149 108 Q 147 113 148 118 Q 149 121 148 124" stroke="#FFF8F0" stroke-width="3" fill="none" stroke-linecap="round"/>
  <rect x="151" y="102" width="3" height="26" rx="1.5" fill="#FFFFFF" opacity="0.4"/>
  <!-- Вогник 1 -->
  <path d="M 154 100 Q 149 91 151 84 Q 153 78 155 82 Q 159 88 157 96 Q 156 99 154 100 Z" fill="#FF9020"/>
  <path d="M 154 99 Q 150 92 152 86 Q 153 81 155 84 Q 158 89 156 97 Z" fill="#FFB840"/>
  <path d="M 154 98 Q 151 93 153 88 Q 154 84 155 87 Q 157 92 155 97 Z" fill="#FFD060"/>
  <ellipse cx="154" cy="91" rx="2.5" ry="4" fill="#FFFFFF" opacity="0.5"/>
  <ellipse cx="154" cy="93" rx="6" ry="9" fill="#FFB020" opacity="0.12"/>

  <!-- Свічка 2 (рожева із золотими смужками) -->
  <rect x="178" y="96" width="10" height="28" rx="4" fill="#FFDDE6"/>
  <rect x="178" y="96" width="10" height="28" rx="4" fill="none" stroke="#F0C0CC" stroke-width="0.8"/>
  <line x1="178" y1="104" x2="188" y2="104" stroke="#D4A847" stroke-width="2" opacity="0.72"/>
  <line x1="178" y1="112" x2="188" y2="112" stroke="#D4A847" stroke-width="2" opacity="0.72"/>
  <line x1="178" y1="120" x2="188" y2="120" stroke="#D4A847" stroke-width="2" opacity="0.72"/>
  <rect x="180" y="98" width="3" height="22" rx="1.5" fill="#FFFFFF" opacity="0.4"/>
  <!-- Вогник 2 -->
  <path d="M 183 96 Q 178 87 180 80 Q 182 74 184 78 Q 188 84 186 92 Q 185 95 183 96 Z" fill="#FF9020"/>
  <path d="M 183 95 Q 179 88 181 82 Q 182 77 184 80 Q 187 86 185 93 Z" fill="#FFB840"/>
  <path d="M 183 94 Q 180 89 182 84 Q 183 80 184 83 Q 186 88 184 93 Z" fill="#FFD060"/>
  <ellipse cx="183" cy="87" rx="2.5" ry="4" fill="#FFFFFF" opacity="0.5"/>
  <ellipse cx="183" cy="89" rx="6" ry="9" fill="#FFB020" opacity="0.12"/>

  <!-- ===== ПЛАВАЮЧІ МАКАРУНИ ===== -->
  <!-- Рожевий макарун ліворуч -->
  <g transform="translate(26,195) rotate(-8)">
    <ellipse cx="0" cy="-10" rx="20" ry="12" fill="#F5A0B8"/>
    <ellipse cx="-2" cy="-12" rx="16" ry="9" fill="#F8B8CC"/>
    <path d="M -20 -4 Q -15 -0.5 -10 -4 Q -5 -0.5 0 -4 Q 5 -0.5 10 -4 Q 15 -0.5 20 -4" stroke="#E890AE" stroke-width="3" fill="none"/>
    <rect x="-20" y="-5" width="40" height="10" fill="#FFF5F8"/>
    <path d="M -20 4 Q -15 0.5 -10 4 Q -5 0.5 0 4 Q 5 0.5 10 4 Q 15 0.5 20 4" stroke="#E890AE" stroke-width="3" fill="none"/>
    <ellipse cx="0" cy="10" rx="20" ry="12" fill="#F5A0B8"/>
    <ellipse cx="-2" cy="12" rx="16" ry="9" fill="#F8B8CC"/>
    <ellipse cx="-4" cy="-14" rx="6" ry="3" fill="#FFFFFF" opacity="0.4" transform="rotate(-20 -4 -14)"/>
  </g>

  <!-- Карамельний макарун праворуч -->
  <g transform="translate(313,240) rotate(12)">
    <ellipse cx="0" cy="-9" rx="17" ry="10" fill="#D4A847"/>
    <ellipse cx="-1" cy="-11" rx="14" ry="8" fill="#DDB850"/>
    <path d="M -17 -3 Q -12 0.5 -7 -3 Q -2 0.5 3 -3 Q 8 0.5 13 -3 Q 16 0 17 -2" stroke="#B08020" stroke-width="3" fill="none"/>
    <rect x="-17" y="-4" width="34" height="8" fill="#FFF8EC"/>
    <path d="M -17 3 Q -12 -0.5 -7 3 Q -2 -0.5 3 3 Q 8 -0.5 13 3 Q 16 0 17 2" stroke="#B08020" stroke-width="3" fill="none"/>
    <ellipse cx="0" cy="9" rx="17" ry="10" fill="#D4A847"/>
    <ellipse cx="-1" cy="11" rx="14" ry="8" fill="#DDB850"/>
    <ellipse cx="-3" cy="-13" rx="5" ry="2.5" fill="#FFFFFF" opacity="0.4" transform="rotate(-20 -3 -13)"/>
  </g>

  <!-- Декоративні перлини та цукрові кулі -->
  <circle cx="22" cy="310" r="5.5" fill="#FFF8F0"/>
  <circle cx="22" cy="310" r="5.5" fill="none" stroke="#D4B890" stroke-width="1"/>
  <circle cx="20" cy="308" r="2" fill="#FFFFFF" opacity="0.72"/>
  <circle cx="318" cy="340" r="5" fill="#FFF0F5"/>
  <circle cx="318" cy="340" r="5" fill="none" stroke="#E0A8B8" stroke-width="1"/>
  <circle cx="316" cy="338" r="1.8" fill="#FFFFFF" opacity="0.72"/>
  <circle cx="16" cy="155" r="3.5" fill="#FFF8F0"/>
  <circle cx="16" cy="155" r="3.5" fill="none" stroke="#D4B890" stroke-width="0.8"/>
  <g opacity="0.4" transform="translate(42,365)">
    <line x1="0" y1="-4" x2="0" y2="4" stroke="#C9A84C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="-4" y1="0" x2="4" y2="0" stroke="#C9A84C" stroke-width="1.5" stroke-linecap="round"/>
  </g>
  <g opacity="0.4" transform="translate(298,372)">
    <line x1="0" y1="-4" x2="0" y2="4" stroke="#F0A0B8" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="-4" y1="0" x2="4" y2="0" stroke="#F0A0B8" stroke-width="1.5" stroke-linecap="round"/>
  </g>
</svg>`,

  // ===========================================================
  // cupcake — placeholder для товарів без фото
  // ViewBox: 0 0 220 270
  // ===========================================================
  cupcake: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 270" role="img" aria-label="Кекс">
  <defs>
    <linearGradient id="cp-wrap" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E890A8"/>
      <stop offset="15%" stop-color="#F9C8D5"/>
      <stop offset="50%" stop-color="#FDE0E8"/>
      <stop offset="85%" stop-color="#F9C8D5"/>
      <stop offset="100%" stop-color="#E890A8"/>
    </linearGradient>
    <linearGradient id="cp-cake" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4A1808"/>
      <stop offset="30%" stop-color="#7A3810"/>
      <stop offset="70%" stop-color="#6A3010"/>
      <stop offset="100%" stop-color="#4A1808"/>
    </linearGradient>
    <radialGradient id="cp-frost" cx="40%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="60%" stop-color="#FFF5F7"/>
      <stop offset="100%" stop-color="#F5D5DC"/>
    </radialGradient>
    <radialGradient id="cp-cherry" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#FF6060"/>
      <stop offset="100%" stop-color="#B01020"/>
    </radialGradient>
    <linearGradient id="cp-gold-spr" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E8C060"/>
      <stop offset="100%" stop-color="#A07020"/>
    </linearGradient>
  </defs>

  <!-- Тінь обгортки -->
  <path d="M 40 250 L 52 164 L 172 164 L 184 250 Z" fill="#D08098" opacity="0.15" transform="translate(4,3)"/>

  <!-- Обгортка паперова -->
  <path d="M 36 250 L 48 164 L 172 164 L 184 250 Z" fill="url(#cp-wrap)"/>
  <!-- Вертикальні смуги обгортки -->
  <line x1="68" y1="164" x2="56" y2="250" stroke="#F5B0C0" stroke-width="8" opacity="0.45"/>
  <line x1="88" y1="164" x2="76" y2="250" stroke="#FDE8EE" stroke-width="3" opacity="0.65"/>
  <line x1="108" y1="164" x2="97" y2="250" stroke="#F5B0C0" stroke-width="8" opacity="0.45"/>
  <line x1="128" y1="164" x2="118" y2="250" stroke="#FDE8EE" stroke-width="3" opacity="0.65"/>
  <line x1="148" y1="164" x2="139" y2="250" stroke="#F5B0C0" stroke-width="8" opacity="0.45"/>
  <line x1="168" y1="164" x2="160" y2="250" stroke="#FDE8EE" stroke-width="3" opacity="0.65"/>
  <!-- Горизонтальні лінії складок -->
  <path d="M 42 193 L 178 193" stroke="#E890A8" stroke-width="0.8" opacity="0.35"/>
  <path d="M 40 218 L 180 218" stroke="#E890A8" stroke-width="0.8" opacity="0.35"/>
  <path d="M 39 233 L 181 233" stroke="#E890A8" stroke-width="0.8" opacity="0.35"/>
  <!-- Гребінець верхнього краю обгортки -->
  <path d="M 48 164 Q 53 158 58 164 Q 63 158 68 164 Q 73 158 78 164 Q 83 158 88 164 Q 93 158 98 164 Q 103 158 108 164 Q 113 158 118 164 Q 123 158 128 164 Q 133 158 138 164 Q 143 158 148 164 Q 153 158 158 164 Q 163 158 168 164 Q 173 158 172 164"
        stroke="#E890A8" stroke-width="2.5" fill="#FDE0E8" opacity="0.92"/>
  <!-- Хвиляста окантовка дна обгортки -->
  <path d="M 36 250 Q 43 244 50 250 Q 57 244 64 250 Q 71 244 78 250 Q 85 244 92 250 Q 99 244 106 250 Q 113 244 120 250 Q 127 244 134 250 Q 141 244 148 250 Q 155 244 162 250 Q 169 244 176 250 Q 181 245 184 250"
        stroke="#D07090" stroke-width="2" fill="none" opacity="0.65"/>
  <!-- Тінь дна обгортки -->
  <ellipse cx="110" cy="254" rx="78" ry="6" fill="#C06080" opacity="0.12"/>

  <!-- Тіло кексу (шоколад) -->
  <rect x="46" y="126" width="128" height="40" rx="4" fill="url(#cp-cake)"/>
  <rect x="46" y="152" width="128" height="14" rx="0 0 4 4" fill="#3A1508" opacity="0.28"/>
  <rect x="46" y="126" width="128" height="10" rx="4 4 0 0" fill="#8A4020" opacity="0.45"/>
  <rect x="65" y="128" width="18" height="36" rx="2" fill="#FFFFFF" opacity="0.05"/>

  <!-- Крем (великий купол) -->
  <path d="M 54 127 Q 51 110 56 95 Q 62 77 74 64 Q 86 51 100 44 Q 110 39 120 44 Q 134 51 146 64 Q 158 77 163 95 Q 168 110 165 127 Z" fill="url(#cp-frost)"/>
  <!-- Бічні тіні крему -->
  <path d="M 54 127 Q 51 110 56 95 Q 62 77 74 64 Q 80 56 89 49 Q 72 58 63 73 Q 52 91 49 111 Q 48 121 52 128 Z" fill="#E8A0B0" opacity="0.22"/>
  <path d="M 165 127 Q 168 110 163 95 Q 157 77 147 64 Q 141 56 132 49 Q 149 58 158 73 Q 169 91 170 111 Q 172 121 167 128 Z" fill="#E8A0B0" opacity="0.18"/>
  <!-- Лінії завитка -->
  <path d="M 74 96 Q 90 82 110 82 Q 130 82 146 97" stroke="#F5D0D8" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M 69 109 Q 88 94 110 93 Q 132 94 150 109" stroke="#F5D0D8" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M 77 120 Q 93 109 110 108 Q 127 109 143 120" stroke="#F5D0D8" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M 110 123 Q 95 119 88 108 Q 82 96 90 84 Q 100 71 110 67" stroke="#ECC0C8" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.65"/>
  <path d="M 110 123 Q 125 119 132 108 Q 138 96 130 84 Q 120 71 110 67" stroke="#ECC0C8" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.65"/>
  <!-- Блик зверху -->
  <ellipse cx="89" cy="70" rx="15" ry="10" fill="#FFFFFF" opacity="0.4" transform="rotate(-20 89 70)"/>
  <ellipse cx="81" cy="75" rx="8" ry="5" fill="#FFFFFF" opacity="0.5" transform="rotate(-30 81 75)"/>
  <!-- Хвиляста окантовка крему знизу -->
  <path d="M 54 127 Q 61 121 68 127 Q 75 121 82 127 Q 89 121 96 127 Q 103 121 110 127 Q 117 121 124 127 Q 131 121 138 127 Q 145 121 152 127 Q 159 121 165 127"
        stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.65"/>

  <!-- Цукерні посипки -->
  <ellipse cx="87" cy="109" rx="4" ry="2" fill="url(#cp-gold-spr)" transform="rotate(-20 87 109)"/>
  <ellipse cx="129" cy="103" rx="4" ry="2" fill="#F5A0B8" transform="rotate(35 129 103)"/>
  <ellipse cx="104" cy="97" rx="4" ry="2" fill="url(#cp-gold-spr)" transform="rotate(10 104 97)"/>
  <ellipse cx="133" cy="116" rx="3.5" ry="1.8" fill="#8060C0" transform="rotate(-15 133 116)"/>
  <ellipse cx="85" cy="119" rx="3.5" ry="1.8" fill="#F5A0B8" transform="rotate(25 85 119)"/>
  <ellipse cx="119" cy="90" rx="3.5" ry="1.8" fill="url(#cp-gold-spr)" transform="rotate(-30 119 90)"/>
  <ellipse cx="99" cy="116" rx="3" ry="1.5" fill="#60A8E0" transform="rotate(15 99 116)"/>
  <ellipse cx="141" cy="106" rx="3" ry="1.5" fill="#8060C0" transform="rotate(-10 141 106)"/>
  <!-- Цукрові перлини -->
  <circle cx="94" cy="82" r="3" fill="#FFF0F5"/>
  <circle cx="94" cy="82" r="3" fill="none" stroke="#E8B0C0" stroke-width="0.8"/>
  <circle cx="93" cy="81" r="1.2" fill="#FFFFFF" opacity="0.8"/>
  <circle cx="131" cy="79" r="2.5" fill="#FFF0F5"/>
  <circle cx="131" cy="79" r="2.5" fill="none" stroke="#E8B0C0" stroke-width="0.8"/>
  <circle cx="130" cy="78" r="1" fill="#FFFFFF" opacity="0.8"/>
  <circle cx="115" cy="113" r="2.5" fill="#FFF5E8"/>
  <circle cx="115" cy="113" r="2.5" fill="none" stroke="#D4A847" stroke-width="0.8"/>

  <!-- Вишня на вершині -->
  <path d="M 110 45 Q 108 35 112 28 Q 115 22 118 26" stroke="#3A6020" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="116" cy="25" rx="8" ry="4" fill="#4A8030" transform="rotate(20 116 25)"/>
  <ellipse cx="116" cy="25" rx="6" ry="3" fill="none" stroke="#3A6020" stroke-width="0.8" transform="rotate(20 116 25)"/>
  <line x1="112" y1="27" x2="120" y2="23" stroke="#3A6020" stroke-width="0.8" opacity="0.6"/>
  <circle cx="110" cy="46" r="13" fill="url(#cp-cherry)"/>
  <circle cx="110" cy="46" r="13" fill="none" stroke="#9A1020" stroke-width="1"/>
  <ellipse cx="105" cy="40" rx="4.5" ry="3.5" fill="#FF8080" opacity="0.72" transform="rotate(-20 105 40)"/>
  <ellipse cx="103" cy="38" rx="2" ry="1.5" fill="#FFFFFF" opacity="0.72" transform="rotate(-20 103 38)"/>
  <ellipse cx="112" cy="53" rx="6" ry="3" fill="#8A1020" opacity="0.28"/>

  <!-- Маленькі декоративні акценти -->
  <g opacity="0.6" transform="translate(18,152)">
    <line x1="0" y1="-5" x2="0" y2="5" stroke="#D4A847" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="-5" y1="0" x2="5" y2="0" stroke="#D4A847" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#D4A847" stroke-width="1" stroke-linecap="round"/>
    <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="#D4A847" stroke-width="1" stroke-linecap="round"/>
  </g>
  <g opacity="0.5" transform="translate(201,92)">
    <line x1="0" y1="-4" x2="0" y2="4" stroke="#F5A0B8" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="-4" y1="0" x2="4" y2="0" stroke="#F5A0B8" stroke-width="1.5" stroke-linecap="round"/>
  </g>
</svg>`,

};

// =============================================================
// illustration(name, extraClass?) → HTML-рядок <svg>
// Кожен виклик отримує унікальні id для <defs>, щоб уникнути
// конфліктів при вставці кількох однакових SVG на сторінку.
// =============================================================
let _ilCounter = 0;
function illustration(name, extraClass = '') {
  const svg = ILLUSTRATIONS[name];
  if (!svg) {
    console.warn(`[illustrations] Невідома ілюстрація: "${name}"`);
    return '';
  }
  const uid = ++_ilCounter;
  // Додаємо клас
  let result = svg.replace('<svg ', `<svg class="illustration${extraClass ? ' ' + extraClass : ''}" `);
  // Збираємо всі id у цьому SVG і робимо їх унікальними
  const ids = [];
  result = result.replace(/\bid="([^"]+)"/g, (_, id) => {
    ids.push(id);
    return `id="${id}_${uid}"`;
  });
  // Оновлюємо всі посилання url(#...) на нові унікальні id
  ids.forEach(id => {
    const re = new RegExp(`url\\(#${id}\\)`, 'g');
    result = result.replace(re, `url(#${id}_${uid})`);
  });
  return result;
}
