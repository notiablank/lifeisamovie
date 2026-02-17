import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationStack {
            VStack {
                Image(systemName: "film")
                    .imageScale(.large)
                    .foregroundStyle(.tint)
                Text("Life is a Movie")
                    .font(.title)
            }
            .padding()
            .navigationTitle("Home")
        }
    }
}

#Preview {
    ContentView()
}
