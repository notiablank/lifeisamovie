import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Image(systemName: "film")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Life Is a Movie")
                .font(.title)
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
