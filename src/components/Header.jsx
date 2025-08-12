const Header = () => {
    return (
        <header className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-semibold">
                    Custom Tokenizer App
                </h1>
                <p className="text-md text-slate-600 mt-1">
                    Train a small vocab from text, then encode/decode. Special tokens are
                    reserved.
                </p>
            </div>
            <button><a className="bg-black text-white text-xl px-4 py-1 rounded-2xl" href="http://" target="_blank">Github</a></button>
        </header>
    );
};

export default Header;
