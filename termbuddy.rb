class Termbuddy < Formula
  desc "AI-powered terminal command assistant - type :: to generate commands or ::: to browse history"
  homepage "https://github.com/RussellPetty/Rose-CLI-Agent"
  url "https://registry.npmjs.org/termbuddy/-/termbuddy-2.1.0.tgz"
  sha256 "" # Will be calculated during first install
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "Terminal Buddy v2.1.0", shell_output("#{bin}/termbuddy --version")
  end
end
