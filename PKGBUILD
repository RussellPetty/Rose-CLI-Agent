# Maintainer: Russell Petty <your-email@example.com>
pkgname=termbuddy
pkgver=2.1.0
pkgrel=1
pkgdesc="AI-powered terminal command assistant - type :: to generate commands or ::: to browse history"
arch=('any')
url="https://github.com/RussellPetty/Rose-CLI-Agent"
license=('MIT')
depends=('nodejs')
optdepends=('fzf: fuzzy finder for command history')
source=("https://registry.npmjs.org/$pkgname/-/$pkgname-$pkgver.tgz")
sha256sums=('SKIP')  # Will be calculated on first build
noextract=("$pkgname-$pkgver.tgz")

package() {
  npm install -g --prefix "$pkgdir/usr" "$srcdir/$pkgname-$pkgver.tgz"

  # Remove references to $pkgdir
  find "$pkgdir" -type f -name package.json -print0 | xargs -0 sed -i "/_where/d"

  # npm gives ownership of all files to build user
  # https://bugs.archlinux.org/task/63396
  chown -R root:root "$pkgdir"
}
