<h1 align="center">🖥️ refresh-rate-quick-tile-gnome-extension 🖥️</h1>
<h2 align="center">Switch between 60 Hz and your display’s maximum refresh rate from GNOME Quick Settings.</h2>

<p align="center">
    <img alt="Computer display" width="180" src="https://emoji-route.vercel.app/svg/🖥️" />
</p>

> [!NOTE]
>
> **Refresh Rate Quick Tile** adds a GNOME Shell quick settings toggle for changing the refresh rate of active displays. It targets GNOME Shell 51 and uses Mutter’s display configuration API.

## 🌟 Features

- **One-tap refresh switching** – switch active displays to the highest supported refresh rate at their current resolution.
- **Normal mode** – switch back to 60 Hz, or the closest available mode if 60 Hz is unavailable.
- **Live state sync** – the tile updates when display settings change elsewhere in GNOME.
- **Native GNOME UI** – uses the Quick Settings tile and Adwaita display icon.

## 💻 Installation

Clone the repository into GNOME’s local extensions directory, then enable it:

###### terminal

```bash
mkdir -p ~/.local/share/gnome-shell/extensions
git clone https://github.com/ArnavK-09/refresh-rate-quick-tile-gnome-extension.git ~/.local/share/gnome-shell/extensions/refresh-rate-quick-tile@dopamide
gnome-extensions enable refresh-rate-quick-tile@dopamide
```

## 💻 Contributing

> [!TIP]
> Suggestions and fixes are welcome. Open an issue or submit a pull request on GitHub.

1. **Fork the repository** on GitHub.
2. **Clone your fork:**

   ```bash
   git clone https://github.com/<your-user>/refresh-rate-quick-tile-gnome-extension.git
   ```

3. **Create a branch:**

   ```bash
   git checkout -b your-feature-branch
   ```

4. **Make and verify your changes** on GNOME Shell 51.
5. **Commit and push** your branch, then open a pull request.

## 🙋‍♂️ Issues

Found a bug or need help? [Open an issue](https://github.com/ArnavK-09/refresh-rate-quick-tile-gnome-extension/issues).

## 👤 Author

<table>
  <tbody>
    <tr>
      <td align="center" valign="top"><a href="https://github.com/ArnavK-09"><img src="https://github.com/ArnavK-09.png?s=100" width="130px" alt="ArnavK-09" /></a><br /><a href="https://github.com/ArnavK-09"><strong>ArnavK-09</strong></a></td>
    </tr>
  </tbody>
</table>

---

<h2 align="center">📄 License</h2>

<p align="center">
<strong>refresh-rate-quick-tile-gnome-extension</strong> is released under the <a href="https://unlicense.org/">Unlicense</a>. See <a href="LICENSE">LICENSE</a> for details.
</p>

---

<p align="center"><strong>🌟 If you find this project helpful, please star it on GitHub! 🌟</strong></p>
